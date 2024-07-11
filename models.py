from app import db
from flask_login import UserMixin
from sqlalchemy.orm import backref
from sqlalchemy import ForeignKey, UniqueConstraint

class User(UserMixin, db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(300), nullable=False)

    playlists = db.relationship('Playlist', backref='author', lazy=True)
    listened_songs = db.relationship('ListenedSong', backref='listener', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'
    
class Playlist(db.Model):
    __tablename__ = "playlists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300), nullable=False)
    user_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)

    songs = db.relationship('PlaylistSong', backref=backref('Playlist', lazy='joined'), lazy=True, cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint('user_id', 'name', name='_user_playlist_name_uc'),)

    def __repr__(self):
        return f'<Playlist {self.name}>'
    
class PlaylistSong(db.Model):
    __tablename__ = "playlist_songs"

    song_id = db.Column(db.String(100), primary_key=True)
    playlist_id = db.Column(db.Integer, ForeignKey('playlists.id'), primary_key=True)

    def __repr__(self):
        return f'<PlaylistSong id: {self.song_id} playlist_id: {self.playlist_id}>'
    
class ListenedSong(db.Model):
    __tablename__ = 'listened_songs'

    song_id = db.Column(db.String(100), primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey('users.id'), primary_key=True)

    def __repr__(self):
        return f'<ListenedSong Song: {self.song_id} User: {self.user_id}>'



