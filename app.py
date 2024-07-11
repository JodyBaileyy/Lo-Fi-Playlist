import os

from flask import Flask 
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.session_protection = "strong"

bcrypt = Bcrypt()
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    "Initiallise application"
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

    login_manager.init_app(app)
    migrate.init_app(app, db)
    db.init_app(app)
    bcrypt.init_app(app)
    
    return app
   



