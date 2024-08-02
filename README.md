# Lo-Fi-Playlist
- Final Project for CS50 course
- Created by Jody Bailey

## What Is This Project? 
A Lofi playlist application written in Flask. It allows users to create their Lofi playlists and discover Lofi songs unique to them

## Key Features
- Registering
- Logging in
- Generating a unique Lofi playlist of songs you have not listened to
- Keeping track of songs you have listened to
- Creating, deleting, and editing your playlists
- Adding or deleting songs from playlists

## How It Works
It utilizes [YouTube's IFrame API](https://developers.google.com/youtube/iframe_api_reference) as well as [YouTube's Data API](https://developers.google.com/youtube/v3/docs). 

The iframe API is used to get a YouTube player on the web page which will play songs along with its video. The video must be displayed as part of [YouTube's Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service). All interactions with the player (e.g. playing, pausing, loading playlists) are done through the iframe API.

The data API is used for collecting videos and information about those videos, which is then displayed on the web page and loaded to the YouTube player. The algorithm used here will query for all videos from 2 channels; [Lofi Girl - Chill Beats](https://www.youtube.com/@Lofigirl-Chillbeats) and [Chillhop Music](https://www.youtube.com/@ChillhopMusic) and will generate a playlist of ~50 songs from these channels that you have not yet listened to. If you have listened to all songs from these channels, then the algorithm will simply search YouTube for other unique Lofi songs.

## Developer Guide
- Create a python virtual environment `python -m venv .venv` and activate the environment `source .venv/bin/activate` (The version used for developing the project was Python 3.12.2) 
- Install dependencies `pip install -r requirements.txt`
- Create a `.env` file in the project's root directory. Use `.env.template` as a template for the environment variables that you will need
- Follow [YouTube's Data API Overview Guide](https://developers.google.com/youtube/v3/getting-started) for getting an API key generated. Add the API key value to the `YOUTUBE_API_KEY` environment variable in your `.env` file. This key will be used when querying the YouTube Data API
- Create a unique string of characters and add that value to the `SECRET_KEY` environment variables in your `.env` file. This key will be used to sign the session cookie whenever a user logs into the application. [You can use this website to generate a unique string value](https://www.uuidgenerator.net/), but the key can be anything.
- Run `python manage.py` which will set up the database
- Run `chmod u+x run-prod.sh` or `chmod u+x run-dev.sh`, depending on which environment you'd like to run the application on
- Run `./run-prod.sh` or `./run-dev.sh`, depending on which environment you'd like to run the application on
- Navigate to [127.0.0.1:9000](http://127.0.0.1:9000/)

## References Used to Create Project
- [YouTube's IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube's Data API](https://developers.google.com/youtube/v3/docs)
- [YouTube's Data API Overview Guide](https://developers.google.com/youtube/v3/getting-started)
- [YouTube's Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [UUID Generator](https://www.uuidgenerator.net/)
- [Authentication with Flask](https://www.freecodecamp.org/news/how-to-authenticate-users-in-flask/)
- [Flask SQL Alchemy Guide](https://www.digitalocean.com/community/tutorials/how-to-use-flask-sqlalchemy-to-interact-with-databases-in-a-flask-application)

