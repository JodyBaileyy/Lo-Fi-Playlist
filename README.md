# Lo-Fi-Playlist
Final Project for CS50x course
Created by Jody Bailey

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

A song is marked as listened when you have listened to 10% or more of a song. For example, if you are listening to a song that is 2 minutes long, it will be marked a listened once you have listened to the song for at least 12 seconds.

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

## Directory structure
### static
#### css
##### auth.css
Styling for the login and register pages
##### home.css
Styling for the home page
##### index.css
File which contains all imports of other stylesheets, which will ultimately be the file that is referenced by the document
##### main.css
The main file with all styling of shared elements and main elements (e.g navigation bar, footer, main containers, variables)
##### playlist.css
Styling for the playlist page
#### images
All image files and a single SVG for the loading icon that displays when generating a unique Lofi songs playlist for a user
#### javascript
##### constants
All constant variables that are re-used
##### helpers
All helper functions used for defining functionality for elements (playlists, playlist songs, modals, buttons, etc.). This can be thought of as the file where all of the functionality for the features of the playlist page can be found.
##### index
This is where the function that gives functionality to the elements on the page is called and is also what the script tag references when the document loads
##### main
This is where all the functions from every file are brought together to create initializer functions. These initializer functions will give functionality to the playlist elements once the script loads. All initializer functions are brought into a main initializer function, which will be called in the index.js file which the document will load
##### player
Where the YouTube player and the lofiPlaylist class live. This is for initializing the player element and defining what should occur once the player is ready, has been updated, or when an error occurs trying to play a song
##### utils
Utility methods for interacting with elements (adding/removing classes, deleting elements, etc.). Also has a utility for creating icon elements.
### templates
#### alert
HTML for the alert that displays on the home and register/login pages
#### home
HTML for the home page. It loads the `lofi_info_card.html` partial with specific content to render out the 2 sections of the home page
#### layout
HTML for the main layout page that is shared between pages
#### lofi_info_card
A partial that is loaded in `home.html` for the 2 Lofi sections on the home page
#### login
HTML for the login page
#### playlist
HTML for the playlist page. Some `div` containers that are created here have no content but are later populated. For example, the `playlist-songs-container` is a div that houses the playlist songs. Because the playlists are the first thing that loads on the page, the `playlist-songs-container` is hidden by default, but once you click on a playlist, it will load the songs, thereby populating the `playlist-songs-container` and its divs with meaningful content. This is to minimize the number of elements that would need to be manually created and to instead utilize the already rendered elements on the page.
#### register
HTML for the register page
### .env.template
A template for the necessary environment variables that the project requires
### .gitignore
Any git files/folders that should be ignored by git
### app
Defines the `create_app` method which initializes the Flask application
### constants
All constant variables
### helpers
Where all helper methods for querying YouTube for videos and video details. Also contains methods for randomizing videos and defining what a response should look like once the front-end queries one of our routes
### manage
Defines a method for setting up our DB
### models
Defines the 4 models that we use to interact with our database's tables
### requirements.txt
The dependencies for the Flask project
### routes
Defines all of the routes we expose when running the application. This file is defined as the root file that Flask uses when running our application, as the `create_app` method is called here
### run-dev
A helper shell script for running the Flask application in development mode with debugging and live reloading
### run-prod
A helper shell script for running the Flask application in production mode

## References Used to Create Project
- [YouTube's IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube's Data API](https://developers.google.com/youtube/v3/docs)
- [YouTube's Data API Overview Guide](https://developers.google.com/youtube/v3/getting-started)
- [YouTube's Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [UUID Generator](https://www.uuidgenerator.net/)
- [Authentication with Flask](https://www.freecodecamp.org/news/how-to-authenticate-users-in-flask/)
- [Flask SQL Alchemy Guide](https://www.digitalocean.com/community/tutorials/how-to-use-flask-sqlalchemy-to-interact-with-databases-in-a-flask-application)
- [ChatGPT](https://chatgpt.com/)
