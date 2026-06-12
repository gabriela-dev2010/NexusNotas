from flask import Flask, render_template, request, redirect, url_for, session, flash, g
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sqlite3
import os
from datetime import timedelta

# --- CONFIGURACIÓN INICIAL ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24)) # Usa variable de entorno en producción
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
DATABASE = 'nexus.db'

# --- FUNCIONES DE BASE DE DATOS ---
def get_db():
    """Conecta a la BD. g es un objeto global por request en Flask."""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row # Para acceder a columnas por nombre
    return g.db

@app.teardown_appcontext
def close_db(error):
    """Cierra la conexión al final de cada request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Crea las tablas según schema.sql"""
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()

@app.cli.command('init-db')
def init_db_command():
    """Comando de terminal: flask init-db"""
    init_db()
    print('Base de datos inicializada.')

# --- DECORADOR LOGIN ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Debes iniciar sesión para acceder a esta página.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# --- RUTAS PRINCIPALES ---
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        nombre = request.form['nombre'].strip()
        email = request.form['email'].lower().strip()
        password = request.form['password']
        colegio = request.form['colegio'].strip()
        nota_min = float(request.form['nota_min'])
        nota_max = float(request.form['nota_max'])
        nota_aprob = float(request.form['nota_aprob'])
        
        db = get_db()
        error = None

        # Validaciones según tu Informe Técnico
        if not all([nombre, email, password, colegio]):
            error = 'Todos los campos son obligatorios.'
        elif len(password) < 8:
            error = 'La contraseña debe tener mínimo 8 caracteres.'
        elif db.execute('SELECT id FROM estudiantes WHERE email =?', (email,)).fetchone():
            error = f'El correo {email} ya está registrado.'
        elif nota_min >= nota_max:
            error = 'La nota mínima debe ser menor que la máxima.'
        elif not (nota_min <= nota_aprob <= nota_max):
            error = 'La nota aprobatoria debe estar entre la mínima y máxima.'

        if error is None:
            try:
                db.execute(
                    '''INSERT INTO estudiantes 
                    (nombre, email, password, colegio, nota_min, nota_max, nota_aprob) 
                    VALUES (?,?,?,?,?,?,?)''',
                    (nombre, email, generate_password_hash(password), colegio, nota_min, nota_max, nota_aprob)
                )
                db.commit()
                flash('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.', 'success')
                return redirect(url_for('login'))
            except sqlite3.IntegrityError:
                error = 'Error inesperado. Intenta de nuevo.'
        
        flash(error, 'error')

    return render_template('registro.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        email = request.form['email'].lower().strip()
        password = request.form['password']
        db = get_db()
        user = db.execute('SELECT * FROM estudiantes WHERE email =?', (email,)).fetchone()

        if user and check_password_hash(user['password'], password):
            session.clear()
            session['user_id'] = user['id']
            session['user_name'] = user['nombre']
            session.permanent = True
            flash(f'Bienvenido de nuevo, {user["nombre"].split()[0]}!', 'success')
            return redirect(url_for('dashboard'))
        
        flash('Correo o contraseña incorrectos.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada correctamente.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    db = get_db()
    user = db.execute('SELECT * FROM estudiantes WHERE id =?', (session['user_id'],)).fetchone()
    return render_template('dashboard.html', user=user)
    
# --- INICIAR APP ---
if __name__ == '__main__':
    # Crea la BD si no existe al iniciar
    if not os.path.exists(DATABASE):
        with app.app_context():
            init_db()
            print('Base de datos creada automáticamente.')
    
    app.run(debug=True, port=5000)