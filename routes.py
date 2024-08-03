from flask import render_template, request, redirect, flash, url_for, jsonify
from flask_login import login_user, login_required, current_user, logout_user
from flask_bcrypt import check_password_hash, generate_password_hash
from helpers import (
    json_response,
    get_random_songs,
    get_songs_response,
    get_time_period,
    get_paginated_video_details,
    get_paginated_playlist_videos,
    get_paginated_searched_lofi_video_ids,
)
from constants import LOFI_GIRL_PLAYLIST_ID, CHILLHOP_MUSIC_PLAYLIST_ID, BACKGROUND_IMAGES, FAVORITES
from app import create_app, login_manager, db
from models import User, Playlist, PlaylistSong, ListenedSong

from sqlalchemy.exc import IntegrityError


@login_manager.user_loader
def load_user(user_id):
    return User.query.filter(User.id == int(user_id)).first()


app = create_app()


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        flash("You are already logged in", "info")
        return redirect(url_for("home"))

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            flash("All fields are required", "danger")
            return redirect(url_for("login"))

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            redirect_path = request.args.get('next')
            login_user(user, remember=True)

            if redirect_path:
                return redirect(redirect_path)

            flash("Logged in!", "success")
            return redirect(url_for("home"))

        flash("Incorrect Username or Password", "danger")
        return redirect(url_for("login"))
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    logout_user()
    flash("Logged out!", "success")

    return redirect(url_for("home"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmed_password = request.form.get("confirmed_password")

        if not username or not password or not confirmed_password:
            flash("All fields are required", "danger")
            return redirect(url_for("register"))

        if len(username) < 5:
            flash("Username should contain 5 or more characters", "danger")
            return redirect(url_for("register"))

        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            flash(f"Username {username} already exists", "danger")
            return redirect(url_for("register"))

        if len(password) < 8:
            flash("Password should be 8 or more characters", "danger")
            return redirect(url_for("register"))

        if password != confirmed_password:
            flash("Passwords do not match", "danger")
            return redirect(url_for("register"))

        user = User(username=username,
                    password=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()

        # Add default favorites playlist for user
        favorites_playlist = Playlist(name=FAVORITES, user_id=user.id)
        db.session.add(favorites_playlist)
        db.session.commit()

        login_user(user),
        flash("Account successfully created! You are now logged in", "success")

        return redirect(url_for("home"))
    else:
        return render_template("register.html")


@app.route("/discover")
@login_required
def discover():
    # Get songs from Lofi girl and chillhop music channels
    paginated_response = get_paginated_playlist_videos(
        LOFI_GIRL_PLAYLIST_ID) + get_paginated_playlist_videos(CHILLHOP_MUSIC_PLAYLIST_ID)

    channel_video_ids = [item["contentDetails"]["videoId"]
                         for response in paginated_response for item in response["items"]]

    listened_song_ids = db.session.query(
        ListenedSong.song_id).filter_by(user_id=current_user.id).all()

    if len(listened_song_ids) == 0:
        songs = get_random_songs(channel_video_ids, 50)
        song_details = get_paginated_video_details(songs)
        filtered_songs = get_songs_response(song_details)

        return jsonify(
            json_response(
                data={"songs": filtered_songs}
            )
        )

    flattened_listened_song_ids = [id for (id,) in listened_song_ids]

    # Filter out songs that are already listened to
    unique_ids = [
        id for id in channel_video_ids if id not in flattened_listened_song_ids]

    # If we don't have at least 50 unique ids, search for additional lofi songs to fill out the remaining ids
    if len(unique_ids) < 50:
        num_of_ids_to_get = 50 - len(unique_ids)
        additional_video_ids = get_paginated_searched_lofi_video_ids(
            num_of_ids_to_get, flattened_listened_song_ids)
        unique_ids.extend(additional_video_ids)

    songs = get_random_songs(unique_ids, 50)
    song_details = get_paginated_video_details(songs)
    filtered_songs = get_songs_response(song_details)

    return jsonify(
        json_response(
            data={"songs": filtered_songs}
        )
    )


@app.route("/playlist", methods=["GET", "POST"])
@login_required
def playlist():
    time_period = get_time_period()

    playlists = Playlist.query.filter_by(
        user_id=current_user.id).order_by(Playlist.id).all()

    return render_template(
        "playlist.html",
        time_period=time_period,
        name=current_user.username,
        image=BACKGROUND_IMAGES.get(time_period)["url"],
        position=BACKGROUND_IMAGES.get(time_period)["position"],
        playlists=playlists,
    )


@app.route("/playlists")
@login_required
def user_playlists():
    playlists = list(map(lambda playlist: {
                     "id": playlist.id, "name": playlist.name}, current_user.playlists))

    return jsonify(
        json_response(data={'playlists': playlists})
    )


@app.route("/playlist/<int:id>")
@login_required
def load_playlist(id):
    user_playlist = Playlist.query.filter_by(
        id=id, user_id=current_user.id).first()

    if not user_playlist:
        return jsonify(
            json_response(error="Playlist does not exist for the current user")
        )

    playlist_songs = user_playlist.songs

    if len(playlist_songs) == 0:
        return jsonify(
            json_response(data={"songs": []})
        )

    song_ids = [playlist_song.song_id for playlist_song in playlist_songs]
    song_details = get_paginated_video_details(song_ids)

    return jsonify(
        json_response(data={"songs": get_songs_response(song_details)})
    )


@app.route("/playlistSong/add", methods=["POST"])
@login_required
def add_song_to_playlist():
    playlist_id = request.args.get("playlistId")
    song_id = request.args.get("songId")

    if not playlist_id or not song_id:
        return jsonify(
            json_response(error="Playlist or song ID not provided")
        )

    try:
        playlist_id = int(playlist_id)
    except ValueError:
        return jsonify(
            json_response(error="Invalid playlist ID")
        )

    user_playlist = Playlist.query.filter_by(
        id=playlist_id, user_id=current_user.id).first()

    if not user_playlist:
        return jsonify(
            json_response(error="Playlist for user does not exist")
        )

    existing_song = PlaylistSong.query.filter_by(
        song_id=song_id, playlist_id=playlist_id).first()

    if existing_song:
        return jsonify(
            json_response(error=f"Song already added to {user_playlist.name}")
        )

    playlist_song = PlaylistSong(song_id=song_id, playlist_id=playlist_id)
    db.session.add(playlist_song)
    db.session.commit()

    return jsonify(
        json_response(data={"songId": playlist_song.song_id})
    )


@app.route("/listened", methods=["POST"])
@login_required
def add_listened_song():
    song_id = request.args.get("id")

    if not song_id:
        return jsonify(
            json_response(error="Song ID not provided")
        )

    existing_listened_song = ListenedSong.query.filter_by(
        song_id=song_id, user_id=current_user.id).first()

    if existing_listened_song:
        return jsonify(
            json_response(error="Song already added to listened list")
        )

    listened_song = ListenedSong(song_id=song_id, user_id=current_user.id)

    db.session.add(listened_song)
    db.session.commit()

    return jsonify(
        json_response(data={"songId": listened_song.song_id})
    )


@app.route("/playlist/create", methods=["POST"])
@login_required
def add_playlist():
    playlist_name = request.args.get("name")

    if not playlist_name:
        return jsonify(
            json_response(error='A name for the playlist was not provided')
        )

    existing_playlist = Playlist.query.filter_by(
        name=playlist_name, user_id=current_user.id).first()

    if existing_playlist:
        return jsonify(
            json_response(error=f"Playlist with name {
                          playlist_name} already exists")
        )

    new_playlist = Playlist(name=playlist_name, user_id=current_user.id)
    db.session.add(new_playlist)
    db.session.commit()

    return jsonify(
        json_response(
            data={'playlist': {'id': new_playlist.id, "name": new_playlist.name}})
    )


@app.route("/playlist/remove", methods=["DELETE"])
@login_required
def remove_playlist():
    playlist_id = request.args.get("id")

    if not playlist_id:
        return jsonify(
            json_response(error="Playlist ID not provided")
        )

    try:
        playlist_id = int(playlist_id)
    except ValueError:
        return jsonify(
            json_response(error="Invalid playlist ID")
        )

    user_playlist = Playlist.query.filter_by(id=playlist_id).first()

    if not user_playlist:
        return jsonify(
            json_response(error="Playlist does not exist")
        )

    if user_playlist.user_id != current_user.id:
        return jsonify(
            json_response(error="Playlist does not belong to current user")
        )

    if user_playlist.name == FAVORITES:
        return jsonify(
            json_response(error="Favorites playlist can not be deleted")
        )

    db.session.delete(user_playlist)
    db.session.commit()

    return jsonify(
        json_response(data={"playlistId": playlist_id})
    )


@app.route('/playlist/rename', methods=["PUT"])
@login_required
def update_playlist_name():
    new_playlist_name = request.args.get('name')
    playlist_id = request.args.get('playlistId')

    if not new_playlist_name or not playlist_id:
        return jsonify(
            json_response(
                error="Playlist id or name not provided")
        )

    try:
        playlist_id = int(playlist_id)
    except ValueError:
        return jsonify(
            json_response(error="Invalid playlist ID")
        )

    user_playlist = Playlist.query.filter_by(
        id=playlist_id, user_id=current_user.id).first()

    if not user_playlist:
        return jsonify(
            json_response(error='Playlist for user does not exist')
        )

    if user_playlist.name == FAVORITES:
        return jsonify(
            json_response(error="Favorites playlist cannot be renamed")
        )

    user_playlist.name = new_playlist_name

    try:
        db.session.commit()
    except IntegrityError:
        return jsonify(
            json_response(error=f"Playlist with name '{
                          new_playlist_name}' already exists")
        )

    return jsonify(
        json_response(data={"playlistId": playlist_id})
    )


@app.route("/playlistSong/remove", methods=["DELETE"])
@login_required
def remove_playlist_song():
    song_id = request.args.get("song_id")
    playlist_id = request.args.get("playlist_id")

    try:
        playlist_id = int(playlist_id)
    except ValueError:
        return jsonify(
            json_response(error="Invalid playlist ID")
        )

    if not song_id or not playlist_id:
        return jsonify(
            json_response(error="Playlist or song ID not provided")
        )

    user_playlist = Playlist.query.filter_by(
        id=playlist_id, user_id=current_user.id).first()

    if not user_playlist:
        return jsonify(
            json_response(error="Playlist for user does not exist")
        )

    playlist_song = PlaylistSong.query.filter_by(
        song_id=song_id, playlist_id=playlist_id).first()

    if not playlist_song:
        return jsonify(
            json_response(error="Playlist song does not exist")
        )

    db.session.delete(playlist_song)
    db.session.commit()

    return jsonify(
        json_response(data={"songId": song_id})
    )
