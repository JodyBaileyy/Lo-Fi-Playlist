
def setup():
	"""Set up the application"""
	from app import create_app, db
	from pathlib import Path
	from flask_migrate import upgrade, migrate, init, stamp
	from models import User, Playlist, PlaylistSong, ListenedSong

	app = create_app()
	app.app_context().push()
	db.create_all()

	migrations_folder = Path('./migrations')

	if not migrations_folder.exists():
		init()

	stamp()
	migrate()
	upgrade()
	
if __name__ == "__main__":
	setup()