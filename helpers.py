import os
import requests
import math
import datetime
import random

from dotenv import load_dotenv

LOFI_GIRL_RECORD_CHANNEL_ID = "UCuw1VDsmOWOldKGLYq6AkVg"
LOFI_GIRL_MAIN_CHANNEL_ID = "UCSJ4gkVC6NrvII8umztf0Ow"
LOFI_GIRL_PLAYLIST_ID = "UUuw1VDsmOWOldKGLYq6AkVg"

CHILLHOP_MUSIC_CHANNEL_ID = "UCOxqgCwgOqC2lMqC5PYz_Dg"
CHILLHOP_MUSIC_PLAYLIST_ID = "UUOxqgCwgOqC2lMqC5PYz_Dg"

SEARCH_URL = 'https://youtube.googleapis.com/youtube/v3/search'
VIDEO_DETAILS_URL = 'https://youtube.googleapis.com/youtube/v3/videos'
PLAYLIST_VIDEOS_URL = 'https://youtube.googleapis.com/youtube/v3/playlistItems'

MUSIC_CATEGORY_ID = 10
SEARCH_LOFI_STRING = "Lofi Beats"

MORNING = "Morning"
AFTERNOON = "Afternoon"
EVENING = "Evening"
NIGHT = "Night"

FAVORITES = "Favorites"

BACKGROUND_IMAGES = {
    MORNING: {
        "url": "/static/images/morning.jpg",
        "position": "top"
    },
    AFTERNOON: {
        "url": "/static/images/afternoon.jpg",
        "position": "center"
    },
    EVENING: {
        "url": "/static/images/evening.jpg",
        "position": "top"
    },
    NIGHT: {
        "url": "/static/images/night.jpg",
        "position": "center"
    }
}

load_dotenv()


def get_time_period():
    hour = datetime.datetime.now().hour

    if hour < 12:
        time_period = MORNING
    elif hour >= 12 and hour < 18:
        time_period = AFTERNOON
    elif hour >= 18 and hour < 22:
        time_period = EVENING
    else:
        time_period = NIGHT

    return time_period


def get_songs_response(song_details):
    """ Helper for formatting song objects + filtering out songs less than a minute """
    return [
        {
            "id": song["id"],
            "duration": get_song_duration(song["contentDetails"]["duration"]),
            "thumbnail": get_thumbnail_url(song),
            "title": song["snippet"]["title"]
        }
        for song in song_details[0]["items"]
        # M indicates a minute value for the duration, and anything less than a minute is probably a youtube short and should be filtered out
        if "M" in song["contentDetails"]["duration"][2:]
    ]


def json_response(data=None, error=None):
    """ Helper for the response format """
    return {
        "data": data,
        "error": error
    }


def get_song_duration(duration_str):
    """ Filter out the P and T characters from the duration string """
    return ''.join(filter(lambda char: char not in ["P", "T"], duration_str))


def get_thumbnail_url(song):
    thumbnail_object = song["snippet"]["thumbnails"]

    for quality in ["maxres", "standard", "high", "medium", "default"]:
        if thumbnail_object.get(quality):
            return thumbnail_object[quality]["url"]


def get_random_songs(ids, amount):
    """ Get an array of  """
    random_indexes = list(range(0, len(ids)))
    random.shuffle(random_indexes)
    random_songs = [ids[random_indexes.pop()]
                    for _ in range(amount) if len(random_indexes) > 0]

    return random_songs


def get_video_details(video_ids, next_page_token='', max_results=50):
    params = {
        'part': 'snippet,contentDetails',
        'maxResults': max_results,
        'key': os.getenv("YOUTUBE_API_KEY"),
        'id': ','.join(video_ids),
        'pageToken': next_page_token,
    }

    response = requests.get(VIDEO_DETAILS_URL, params=params)
    return response.json()


def get_playlist_videos(playlist_id, next_page_token='', max_results=50):
    params = {
        'part': 'contentDetails',
        'playlistId': playlist_id,
        'maxResults': max_results,
        'key': os.getenv("YOUTUBE_API_KEY"),
        'pageToken': next_page_token,
    }
    response = requests.get(PLAYLIST_VIDEOS_URL, params=params)
    return response.json()


def search_youtube(query, next_page_token='', max_results=50):
    params = {
        'part': 'snippet',
        'q': query,
        'type': 'video',
        'maxResults': max_results,
        'key': os.getenv("YOUTUBE_API_KEY"),
        'videoCategoryId': MUSIC_CATEGORY_ID,
        'videoEmbeddable': 'true',
        'pageToken': next_page_token,
    }
    response = requests.get(SEARCH_URL, params=params)
    return response.json()


def get_paginated_response(query_ids, query_method):
    first_response = query_method(query_ids)
    paginated_details = [first_response]

    next_page_token = first_response.get('nextPageToken')
    total_results = first_response['pageInfo']['totalResults']
    results_per_page = first_response['pageInfo']['resultsPerPage']

    if next_page_token:
        pagination_amount = math.ceil(
            (total_results - results_per_page) / results_per_page
        )

        for _ in range(pagination_amount):
            response = query_method(query_ids, next_page_token)
            paginated_details.append(response)
            next_page_token = response.get('nextPageToken')

    return paginated_details


def filtered_searched_videos(videos, listened_song_ids):
    return [
        video['id']['videoId'] for video in videos['items']
        if video['id']['videoId'] not in listened_song_ids
        and video['snippet']['liveBroadcastContent'] != 'live'
        and video['snippet']['channelId'] not in [LOFI_GIRL_RECORD_CHANNEL_ID, CHILLHOP_MUSIC_CHANNEL_ID, LOFI_GIRL_MAIN_CHANNEL_ID]
    ]


def get_paginated_searched_lofi_video_ids(num_of_video_ids, listened_song_ids):
    response = search_youtube(SEARCH_LOFI_STRING)
    next_page_token = response['nextPageToken']
    filtered_ids = filtered_searched_videos(response, listened_song_ids)

    song_ids = filtered_ids[:num_of_video_ids]

    while len(song_ids) < num_of_video_ids:
        response = search_youtube(
            SEARCH_LOFI_STRING, next_page_token=next_page_token)
        filtered_ids = filtered_searched_videos(response, listened_song_ids)
        next_page_token = response['nextPageToken']
        remaining_num_of_ids = num_of_video_ids - len(song_ids)

        song_ids.extend(filtered_ids[:remaining_num_of_ids])

    return song_ids


def get_paginated_video_details(video_ids):
    return get_paginated_response(video_ids, get_video_details)


def get_paginated_playlist_videos(playlist_id):
    return get_paginated_response(playlist_id, get_playlist_videos)
