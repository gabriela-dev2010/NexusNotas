from flask import Flask, render_template, request, redirect, jsonify, url_for, session, flash, g
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
    return render_template('index.html', page_mood='index')

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

    return render_template('registro.html', page_mood='registro')

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
    
    return render_template('login.html', page_mood='login')

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
    user = dict(user)
    if 'foto_perfil' not in user or not user['foto_perfil']:
        user['foto_perfil'] = 'img/nutria_mago.png'

    return render_template('dashboard.html', user=user, active_page='inicio', page_mood='dashboard')

@app.route('/mis_materias')
@login_required
def mis_materias():
    db = get_db()
    materias = db.execute(
        'SELECT * FROM materias WHERE estudiante_id = ? ORDER BY fecha_creacion DESC',
        (session['user_id'],)  # Ojo: usa 'user_id' si así se llama en tu session
    ).fetchall()
    return render_template('mis_materias.html', materias=materias, page_mood='mis_materias')

@app.route('/borrar_materia/<int:id>', methods=['POST'])
@login_required
def borrar_materia(id):
    db = get_db()
    db.execute('DELETE FROM materias WHERE id = ? AND estudiante_id = ?', 
               (id, session['user_id']))
    db.commit()
    return redirect(url_for('mis_materias'))

@app.route('/editar_materia/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_materia(id):
    db = get_db()
    if request.method == 'POST':
        nota1 = float(request.form['nota1'])
        nota2 = float(request.form['nota2'])
        nota3 = float(request.form['nota3'])
        nota_final = round((nota1 + nota2 + nota3) / 3, 2)
        
        db.execute(
            'UPDATE materias SET nota1=?, nota2=?, nota3=?, nota_final=? WHERE id=? AND estudiante_id=?',
            (nota1, nota2, nota3, nota_final, id, session['user_id'])
        )
        db.commit()
        return redirect(url_for('mis_materias'))
    
    materia = db.execute('SELECT * FROM materias WHERE id=?', (id,)).fetchone()
    return render_template('editar_materia.html', materia=materia)

@app.route('/guardar_nota', methods=['POST'])
@login_required
def guardar_nota():
    try:
        data = request.get_json()
        nombre_materia = data['materia'].strip()
        
        # ARREGLA LA COMA: cambia 4,7 por 4.7
        nota_str = str(data['nota']).replace(',', '.')
        nueva_nota = float(nota_str)
        
        descripcion = data.get('descripcion', '')
        periodo = data.get('periodo', '')
        
        db = get_db()
        
        materia = db.execute(
            "SELECT id FROM materias WHERE nombre=? AND estudiante_id=?",
            (nombre_materia, session['user_id'])
        ).fetchone()
        
        if not materia:
            cursor = db.execute(
                "INSERT INTO materias (estudiante_id, nombre) VALUES (?,?)",
                (session['user_id'], nombre_materia)
            )
            materia_id = cursor.lastrowid
        else:
            materia_id = materia['id']
        
        db.execute(
            "INSERT INTO notas (materia_id, valor, descripcion, periodo) VALUES (?,?,?,?)",
            (materia_id, nueva_nota, descripcion, periodo)
        )
        
        promedio = db.execute(
            "SELECT AVG(valor) FROM notas WHERE materia_id=?",
            (materia_id,)
        ).fetchone()[0]
        
        db.commit()
        return jsonify({'status': 'ok', 'promedio': round(promedio, 2)})
    
    except Exception as e:
        print("ERROR EN FLASK:", e) # Esto lo ves en la terminal
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500

        # RUTA NUEVA PARA LA DB CON TABLA notas SEPARADA
@app.route('/guardar_materia_completa', methods=['POST'])
@login_required
def guardar_materia_completa():
    try:
        data = request.get_json()
        nombre_materia = data['materia'].strip()
        lista_notas = data['notas'] # ← Recibe [4.7, 2.0]
        periodo = data.get('periodo', '1er Corte')
        
        db = get_db()
        
        materia = db.execute(
            "SELECT id FROM materias WHERE nombre=? AND estudiante_id=?",
            (nombre_materia, session['user_id'])
        ).fetchone()
        
        if not materia:
            cursor = db.execute(
                "INSERT INTO materias (estudiante_id, nombre) VALUES (?,?)",
                (session['user_id'], nombre_materia)
            )
            materia_id = cursor.lastrowid
        else:
            materia_id = materia['id']
        
        # Borra notas viejas y mete las nuevas
        db.execute("DELETE FROM notas WHERE materia_id=?", (materia_id,))
        
        for nota_valor in lista_notas:
            db.execute(
                "INSERT INTO notas (materia_id, valor, periodo) VALUES (?,?,?)",
                (materia_id, float(nota_valor), periodo)
            )
        
        promedio = db.execute(
            "SELECT AVG(valor) FROM notas WHERE materia_id=?",
            (materia_id,)
        ).fetchone()[0]
        
        db.commit()
        return jsonify({'status': 'ok', 'promedio': round(promedio, 2)})
    
    except Exception as e:
        print("ERROR EN FLASK:", str(e))
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500

@app.route('/calendario')
@login_required
def calendario():
    db = get_db()
    user = db.execute('SELECT * FROM estudiantes WHERE id =?', (session['user_id'],)).fetchone()
    user = dict(user)
    if 'foto_perfil' not in user or not user['foto_perfil']:
        user['foto_perfil'] = 'img/nutria_mago.png'
    
    return render_template('calendario.html', user=user, active_page='calendario', page_mood='calendario')
@app.route('/ajustes')
@login_required
def ajustes():
    db = get_db()
    user = db.execute('SELECT * FROM estudiantes WHERE id =?', (session['user_id'],)).fetchone()
    user = dict(user)
    if 'foto_perfil' not in user or not user['foto_perfil']:
        user['foto_perfil'] = 'img/nutria_mago.png'
    return render_template('ajustes.html', user=user, active_page='ajustes', page_mood='ajustes')

@app.route('/ayuda')
@login_required
def ayuda():
    db = get_db()
    user = db.execute('SELECT * FROM estudiantes WHERE id =?', (session['user_id'],)).fetchone()
    user = dict(user)
    if 'foto_perfil' not in user or not user['foto_perfil']:
        user['foto_perfil'] = 'img/nutria_mago.png'
    return render_template('ayuda.html', user=user, active_page='ayuda', page_mood='ayuda')

    
# --- INICIAR APP ---
if __name__ == '__main__':
    # Crea la BD si no existe al iniciar
    if not os.path.exists(DATABASE):
        with app.app_context():
            init_db()
            print('Base de datos creada automáticamente.')
    
    app.run(debug=True, port=5000)