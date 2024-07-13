// Youtube config
// 2. This code loads the IFrame Player API code asynchronously.

let tag = document.createElement('script');

// Player states
const UNSTARTED = -1;
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const VIDEOCUED = 5;

class Playlist {
  constructor() {
    this.playingPlaylist = [];
    this.quedPlaylist = [];
    this.cuedPlaylistData = [];
    this.playlingPlaylistData = [];
    this.loadingNewPlaylistSong = false;
    this.playingSongInterval = null;
    this.playingSong = null;
  }
  
  quedPlaylistIsPlaying() {
    return this.playingPlaylist === this.quedPlaylist;
  }

  // For race conditions when the player needs to get up to date to play the video at the specified index
  updatePlaylist(index, songId) {
    this.loadingNewPlaylistSong = true;
    this.playlingPlaylistData = this.cuedPlaylistData;
    this.playingPlaylist = this.quedPlaylist;

    player.cuePlaylist(lofiPlaylist.quedPlaylist);
    
    setTimeout(() => {
      player.playVideoAt(index);
      handleNewSongLoad(songId)
      
      this.loadingNewPlaylistSong = false;
    }, 1000)
  }

  createPlayingSongInterval() {
    this.playingSongInterval = setInterval(async () => {
      // If songs has been played for 10 or more seconds
      if (player.playerInfo.currentTime >= 10) {
        try {
          await addSongToListenedList(this.playingSong);
        } catch (err) {
          console.log(
            'error occured adding song to listened list: ',
            err.message
          );
        } finally {
          clearInterval(this.playingSongInterval);
        }
      }
    }, 1000)
  }

  getPlayingSongData() {
    return this.playlingPlaylistData.find((song) => {
      return song.id === this.playingSong;
    })
  }
}

const lofiPlaylist = new Playlist();

tag.src = 'https://www.youtube.com/iframe_api';
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
let player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    playerVars: {
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  const nextButton = document.querySelector('#next');
  const previousButton = document.querySelector('#previous');
  const pausePlayButton = document.querySelector('#play-pause');
  const playerElapsedTime = document.querySelector('.player-elapsed-time')

  nextButton.addEventListener('click', () => {
    event.target.nextVideo();
  });
  previousButton.addEventListener('click', () => {
    event.target.previousVideo();
  });
  pausePlayButton.addEventListener('click', () => {
    const playerState = event.target.getPlayerState();

    // If song hasn't started playing, is cued, or is paused
    if ([UNSTARTED, PAUSED, VIDEOCUED].includes(playerState)) {
      event.target.playVideo();
    } else if (playerState === PLAYING) {
      event.target.pauseVideo();
    }
  });

  setInterval(() => {
    playerElapsedTime.textContent = convertToPlayerFormat(player.getCurrentTime());
  }, 1000)
}


// 5. The API calls this function when the player's state changes.
function onPlayerStateChange(event) {
  const playerVidId = event.target.playerInfo.videoData.video_id;

  if (!playerVidId) return;

  const pausePlayWidgetButton = document.querySelector('#play-pause');
  let { toggleSongButton } = getPlayingPlaylistSongElements(lofiPlaylist.playingSong);

  // Change the play / pause button icon on the widget and playlist song if a song is loaded
  if (event.target.getPlayerState() === PLAYING) {
    replaceClass(pausePlayWidgetButton?.firstElementChild, playIconClass, pauseIconClass);
    replaceClass(toggleSongButton?.firstElementChild, playIconClass, pauseIconClass);
  } else {
    replaceClass(pausePlayWidgetButton?.firstElementChild, pauseIconClass, playIconClass);
    replaceClass(toggleSongButton?.firstElementChild, pauseIconClass, playIconClass);
  }

  // If a new song is loaded and isn't already being handled by the updatePlaylist class method
  if (!lofiPlaylist.loadingNewPlaylistSong && lofiPlaylist.playingSong !== playerVidId) {
    handleNewSongLoad(playerVidId);
  }
}

const handleNewSongLoad = (newSongId) => {
  // Changes:
    // - The previously playing songs icon to a play icon, and change the playing songs icon to a paused icon
    // - Removes the previously playing songs border class, and adds the border class to the new playing song
    // - Updated the widget with the new playing song's info

  const isFirstLoad = !lofiPlaylist.playingSong;
  const favoriteSongButton = document.querySelector('#favorite');
  const addToPlaylistSelect = document.querySelector('.add-to-playlist');
  const { playerSongThumbnail, playerSongTotalTime, playerSongTitle } = getPlayerInfoElements();
  let { playlistSong, toggleSongButton } = getPlayingPlaylistSongElements(lofiPlaylist.playingSong);

  clearInterval(lofiPlaylist.playingSongInterval);

  replaceClass(toggleSongButton?.firstElementChild, pauseIconClass, playIconClass);
  removeClasses(playlistSong, playingSongBorderClass);

  ({ toggleSongButton, playlistSong } = getPlayingPlaylistSongElements(newSongId));

  replaceClass(toggleSongButton?.firstElementChild, playIconClass, pauseIconClass);
  addClasses(playlistSong, playingSongBorderClass);
  
  lofiPlaylist.playingSong = newSongId;
  favoriteSongButton.dataset.videoId = newSongId;
  addToPlaylistSelect.dataset.videoId = newSongId;
  addToPlaylistSelect.value = '--';

  const { title, thumbnail, duration } = lofiPlaylist.getPlayingSongData();

  playerSongThumbnail.src = thumbnail;
  playerSongThumbnail.alt = `${title} thumbnail`;

  playerSongTotalTime.textContent = duration;
  playerSongTitle.textContent = title;

  if (isFirstLoad) {
    handleFirstLoad();
  }
  
  lofiPlaylist.createPlayingSongInterval();
}


// Creating new playlists elements
const newPlaylistButton = document.querySelector('.new-playlist');
const newPlaylistModel = document.querySelector('.new-playlist-modal');
const createPlaylistButton = document.querySelector('.create-playlist');
const cancelCreateButton = document.querySelector('.cancel-create');
const playlistNameInput = document.querySelector('.name-input');

// Renaming playlist
const renamePlaylistModal = document.querySelector('.rename-playlist-modal');
const newPlaylistNameInput = document.querySelector('.new-name-input');
const cancelRenameButton = document.querySelector('.cancel-rename');
const confirmRename = document.querySelector('.confirm-rename');

// Greying out background for when modals are active
const greyedOutBackground = document.querySelector(".greyed-out-background");

// Adding songs to playlists elements
const addToPlaylistSelect = document.querySelector('.add-to-playlist');
const favoriteButton = document.querySelector('#favorite');
const favoritesPlaylist = document.querySelector(
  "[data-playlist-name='Favorites']"
);

// Loading playlist
const playlistEntries = document.querySelectorAll('.playlist-item');
const playlistContainer = document.querySelector('.playlist-container');

// Playlist song elements
const backToPlaylists = document.querySelector("#back-to-playlists-btn");
const playlistSongsContainer = document.querySelector('.playlist-songs-container');
const playlistHeader = document.querySelector('.playlist-header');

// Discover songs
const dicoverSongsButton = document.querySelector('.discover-lofi-songs-btn');

// Icon Classes
const playIconClass = 'bi-play-circle-fill';
const pauseIconClass = 'bi-pause-circle-fill';
const nextIconClass = 'bi-caret-right-fill';
const previousIconClass = 'bi-caret-left-fill';
const unfilliedHeartIconClass = 'bi-heart';
const filledHeartIconClass = 'bi-heart-fill';
const deleteIconClass = 'bi-trash2-fill';
const addToPlaylistIconClass = 'bi-folder-plus';
const backIconClass = 'bi-arrow-left'; 

// Util classes
const playingSongBorderClass = 'playing-song-border';

const addSongToListenedList = async (songId) => {
  try {
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(`/listened?id=${songId}`, settings);

    return await response.json();
  } catch (err) {
    return err;
  }
};

const fetchAllPlaylists = async () => {
  try {
    const response = await fetch('/playlists');

    return await response.json();
  } catch(err) {
    return err;
  }
}

const deletePlaylistSong = async (songId, playlistId) => {
  try {
    const settings = {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(
      `/playlistSong/remove?song_id=${songId}&playlist_id=${playlistId}`,
      settings
    );

    return await response.json();
  } catch (err) {
    return err;
  }
};

const deletePlaylist = async (playlistId) => {
  try {
    const settings = {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(`/playlist/remove?id=${playlistId}`, settings);

    return await response.json();
  } catch (err) {
    return err;
  }
};

const fetchDiscoverySongs = async () => {
  try {
    const response = await fetch('/discover');

    return await response.json();
  } catch (err) {
    return err;
  }
};

const fetchPlaylist = async (id) => {
  try {
    const response = await fetch(`/playlist/${id}`);

    return await response.json();
  } catch (err) {
    return err;
  }
};

const createPlaylist = async (name) => {
  try {
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(`/playlist/create?name=${name}`, settings);

    return await response.json();
  } catch (err) {
    return err;
  }
};

const addSongToPlaylist = async (playlistId, songId) => {
  try {
    const settings = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(
      `/playlistSong/add?playlistId=${playlistId}&songId=${songId}`,
      settings
    );

    return await response.json();
  } catch (err) {
    return err;
  }
};

const renamePlaylist = async (playlistId, name) => {
  try {
    const settings = {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(
      `/playlist/rename?playlistId=${playlistId}&name=${name}`,
      settings
    );

    return await response.json();
  } catch (err) {
    return err;
  }
};

const handleFirstLoad = () => {
  const youtubePlayer = document.querySelector('#player');
  const playerWidget = document.querySelector('.player-widget');

  removeClasses(youtubePlayer, 'd-none');
  removeClasses(playerWidget, 'd-none');
}


const getIcon = (name, size) => {
  const iconElement = document.createElement('i');

  // The smaller the size argument, the larger the size of the icon
  switch (name.toLowerCase()) {
    case 'play':
      iconElement.className = `bi ${playIconClass} fs-${size}`;
      break;
    case 'pause':
      iconElement.className = `bi ${pauseIconClass} fs-${size}`;
      break;
    case 'previous':
      iconElement.className = `bi ${previousIconClass} fs-${size}`;
      break;
    case 'next':
      iconElement.className = `bi ${nextIconClass} fs-${size}`;
      break;
    case 'delete':
      iconElement.className = `bi ${deleteIconClass} fs-${size}`;
      break;
    case 'add':
      iconElement.className = `bi ${addToPlaylistIconClass} fs-${size}`;
      break;
    case 'heartUnfilled':
      iconElement.className = `bi ${unfilliedHeartIconClass} fs-${size}`;
      break;
    case 'heartFilled':
      iconElement.className = `bi ${filledHeartIconClass} fs-${size}`;
      break;
    case 'back':
      iconElement.className = `bi ${backIconClass} fs-${size}`;
      break;
  }

  return iconElement;
};

const replaceClass = (element, oldClass, newClass) => {
  if (!element) return;

  element.classList.replace(oldClass, newClass);
};

const removeClasses = (element, ...classes) => {
  if (!element) return;

  element.classList.remove(...classes);
}

const addClasses = (element, ...classes) => {
  if (!element) return;

  element.classList.add(...classes);
}

const toggleClass = (element, className) => {
  if (!element) return;

  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}

const convertToPlayerFormat = (time) => {
  if (!time) return '0:00';

  let seconds, minutes, hours = 0;
  
  hours = Math.floor(time / 3600);
  minutes = Math.floor(time / 60);
  seconds = Math.floor(time - (hours * 3600) - (minutes * 60));

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  
  if (hours === 0) {
    return `${minutes}:${seconds}`;
  } 

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  return `${hours}:${formattedMinutesSeconds}`;
}

const toggleGreyedOutBackground = () => {
  toggleClass(greyedOutBackground, 'd-none');
}

const getPlayingPlaylistSongPausePlayButton = (songId) => {
  return document.querySelector(`.play-playlist-song-btn[data-video-id='${songId}']`)
}

const getPlayingPlaylistSongElements = (songId) => {
  const playlistSong = document.querySelector(`.playlist-song[data-video-id='${songId}']`);
  const toggleSongButton = playlistSong?.querySelector('.play-playlist-song-btn');

  return {
    playlistSong,
    toggleSongButton
  }
}

const getPlayerInfoElements = () => {
  const playerSongThumbnail = document.querySelector('.player-song-thumbnail');
  const playerSongTitle = document.querySelector('.player-song-title');
  const playerSongTotalTime = document.querySelector('.player-song-total-time');

  return {
    playerSongThumbnail,
    playerSongTitle,
    playerSongTotalTime
  }
}

const personalisePlaylistHeader = (playlistName) => {
  const playlistTitle = document.querySelector('.playlist-header-title');
  const playPlaylistButton = document.querySelector('.play-playlist-btn');

  playPlaylistButton.addEventListener('click', () => {
    if (!lofiPlaylist.quedPlaylistIsPlaying()) {
      player.cuePlaylist(lofiPlaylist.quedPlaylist);
      lofiPlaylist.playingPlaylist = lofiPlaylist.quedPlaylist;
    }

    player.playVideoAt(0);
  })

  playlistTitle.textContent = playlistName;
}

const createPlaylistSelectContainer = (playlists, songId) => {
  const container = document.createElement('div');
  const select = document.createElement('select');
  const defaultSelectOption = document.createElement('option');
  const addButton = document.createElement('button');
  const addIcon = getIcon('add', 5);

  container.className = 'song-playlist-select-container position-relative align-self-center';

  addButton.className = 'btn song-add-to-playlist-btn'
  addButton.append(addIcon);

  defaultSelectOption.disabled = true;
  defaultSelectOption.textContent = '--';
  defaultSelectOption.selected = true;

  select.className = 'song-add-to-playlist-select position-absolute';
  select.dataset.videoId = songId;
  select.append(defaultSelectOption);
  addFunctionalityToPlaylistSelect(select);

  playlists.forEach(playlist => {
    const option = document.createElement('option');

    option.value = playlist.id;
    option.textContent = playlist.name;

    select.append(option);
  })
  
  container.append(addButton, select)
  
  return container;
}

const displayAlert = (level, text) => {
  const alert = document.createElement('div');
  const alertText = document.createElement('div');
  const clostAlertButton = document.createElement('button');
  const mainElement = document.querySelector('main');

  clostAlertButton.type = 'button';
  clostAlertButton.className = 'btn-close';
  clostAlertButton.dataset.bsDismiss = 'alert';
  clostAlertButton.ariaLabel = 'Close';

  alertText.textContent = text;

  alert.role = 'alert';
  alert.className = `playlist-alert alert alert-dismissible alert-${level} position-sticky fade show text-center`;
  alert.append(alertText, clostAlertButton);

  mainElement.insertBefore(alert, mainElement.firstChild);

  // Close the alert after 8 seconds
  setTimeout(() => {
    clostAlertButton.click();
  }, 8000);
}

// Helper for adding playlist songs to the page
const renderPlaylistSongs = async (name, songs, playlistId = null) => {
  let playlistData;
  const playlistSongs = playlistSongsContainer.querySelectorAll('.playlist-song');

  // Get playlist data for "add to playlist" select element for the playlist song
  try {
    const response = await fetchAllPlaylists();

    playlistData = response.data.playlists;
  } catch(err) {
    displayAlert('danger', `Internal error occurred trying to fetch playlists: ${err.message}`);
    console.log("Failed to fetch playlists for select element: ", err.message);
  }

  playlistSongs.forEach(playlistSong => {
    playlistSongsContainer.removeChild(playlistSong);
  })

  playlistSongsContainer.append(backToPlaylists, playlistHeader);

  songs.forEach((song, index) => {
    const playlistSongElement = document.createElement('div');
    const playlistSongTitle = document.createElement('div');
    const playlistDuration = document.createElement('div');
    const playSongButton = document.createElement('button');
    const playlistThumbnail = document.createElement('img');
    const playlistInfoContainer = document.createElement('div');

    const playSongIcon = getIcon('play', 2);
    const playlistSelectContainer = createPlaylistSelectContainer(playlistData, song.id);

    playlistSongTitle.className = 'playlist-song-title text-truncate';
    playlistSongTitle.textContent = song.title;

    playlistDuration.className = 'playlist-song-duration';
    playlistDuration.textContent = song.duration;

    playSongButton.className = 'play-playlist-song-btn btn';
    playSongButton.dataset.videoId = song.id;
    playSongButton.appendChild(playSongIcon);
    playSongButton.addEventListener('click', () => {
      if (!lofiPlaylist.quedPlaylistIsPlaying()) {
        lofiPlaylist.updatePlaylist(index, song.id);
      } else {
          // If player isn't already playing the song we're working with
        if (player.playerInfo.playlistIndex !== index) {
          player.playVideoAt(index);
        } else if (player.getPlayerState() === PLAYING) { // if already playing the song, pause or play the song
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    });

    playlistThumbnail.src = song.thumbnail;
    playlistThumbnail.className = 'playlist-song-thumbnail rounded';
    playlistThumbnail.alt = `${song.title} thumbnail`;

    playlistInfoContainer.className = 'playlist-info-container d-flex flex-column px-3 justify-content-center';
    playlistInfoContainer.append(playlistSongTitle, playlistDuration);

    playlistSongElement.dataset.videoId = song.id;
    playlistSongElement.className = 'playlist-song d-flex py-4 my-1';

    const playlistSongElementChildren = [
      playSongButton,
      playlistThumbnail,
      playlistInfoContainer,
      playlistSelectContainer
    ];

    if (playlistId) {
      const deleteSongButton = document.createElement('button');

      deleteSongButton.className = 'delete-playlist-song-btn btn';
      deleteSongButton.append(getIcon('delete', 5));
      deleteSongButton.addEventListener('click', async () => {
        try {
          const response = await deletePlaylistSong(song.id, playlistId);

          if (!response.error) {
            playlistSongsContainer.removeChild(playlistSongElement);
            displayAlert('success', 'Song Deleted!')
          } else {
            displayAlert('warning', `Failed to delete song: ${response.error}`);
          }
        } catch (err) {
          displayAlert('danger', `Internal error occured trying to delete song: ${err.message}`);
          console.log('Error deleting playlist Song: ', err);
        }
      });

      playlistSongElementChildren.push(deleteSongButton);
    }

    playlistSongElement.append(...playlistSongElementChildren);
    playlistSongsContainer.appendChild(playlistSongElement);
  });

  personalisePlaylistHeader(name);
  toggleClass(playlistContainer, 'd-none');
  toggleClass(playlistSongsContainer, 'd-none');
};

const addFunctionalityToPlaylistSelect = (select) => {
  select.addEventListener('change', async (e) => {
    try {
      const { videoId } = e.target.dataset;
      const playlistId = e.target.value;
  
      const playlistItem = document.querySelector(
        `.playlist-item[data-playlist-id='${playlistId}']`
      );
      const playlistSongNum = playlistItem.querySelector('.playlist-songs-num');
      const numberofSongs = parseInt(playlistSongNum.textContent.split(' ')[0]);
  
      const response = await addSongToPlaylist(playlistId, videoId);
    
      if (!response.error) {
        playlistSongNum.textContent = `${numberofSongs + 1} songs`;
        displayAlert('success', 'Added to playlist!');
      } else {
        displayAlert('warning', `Failed to add song to playlist: ${response.error}`);
      }
    } catch (err) {
      displayAlert('danger', `Internal error occurred while adding song to playlist: ${err.message}`);
    }
  });
}

const addFunctionalityToPlaylists = (playlists) => {
  playlists.forEach((playlist) => {
    const playlistName = playlist.querySelector('.playlist-name');

    // Load the playlist songs
    playlistName.addEventListener('click', async () => {
      try {
        const response = await fetchPlaylist(
          playlist.dataset.playlistId
        );

        if (!response.error) {
          renderPlaylistSongs(
            playlistName.innerText,
            response.data.songs,
            playlist.dataset.playlistId
          );
  

          const songIds = response.data.songs.map((song) => song.id);

          lofiPlaylist.quedPlaylist = songIds;
          lofiPlaylist.cuedPlaylistData = response.data.songs;
        } else {
          displayAlert('warning', `Failed to load playlist: ${response.error}`);
        }
      } catch (err) {
        displayAlert('danger', `Internal error occured trying to load playlist: ${err.message}`);
        console.log('Error getting playlist songs: ', err.message);
      }
    });

    // Add button to delete + rename playlist if playlist isn't the favorites playlist
    if (playlist.dataset.playlistName !== 'Favorites') {
      const deletePlaylistButton = document.createElement('button');
      const playlistContainer = playlist.parentElement;

      const renameButton = document.createElement('button');

      renameButton.textContent = 'Rename';
      renameButton.className = 'rename-playlist-btn btn';
      renameButton.addEventListener('click', () => {
        toggleGreyedOutBackground();
        toggleClass(renamePlaylistModal, 'd-none')

        confirmRename.dataset.playlistId = playlist.dataset.playlistId;
        newPlaylistNameInput.focus();
      });

      deletePlaylistButton.textContent = 'Delete';
      deletePlaylistButton.className = 'delete-playlist-btn btn';
      deletePlaylistButton.addEventListener('click', async () => {
        try {
          const response = await deletePlaylist(playlist.dataset.playlistId);

          if (!response.error) {
            // Remove option in playlist select and remove playlist
            const optionElement = addToPlaylistSelect.querySelector(
              `[value='${playlist.dataset.playlistId}']`
            );

            addToPlaylistSelect.removeChild(optionElement);
            playlistContainer.removeChild(playlist);
            displayAlert('success', 'Playlist Deleted!')
          } else {
            displayAlert('warning', `Failed to delete playlist: ${response.error}`)
          }
        } catch (err) {
          displayAlert('danger', `Internal error occured trying to delete playlist: ${err.message}`);
          console.log('error occured trying to delete playlist: ', err.message);
        }
      });

      playlist.append(renameButton, deletePlaylistButton);
    }
  });
};

backToPlaylists.addEventListener('click', () => {
  toggleClass(playlistContainer, 'd-none');
  toggleClass(playlistSongsContainer, 'd-none');
})

dicoverSongsButton.addEventListener('click', async (e) => {
  try {
    e.target.disabled = true;
    const response = await fetchDiscoverySongs();

    renderPlaylistSongs(
      "Made for You",
      response.data.songs
    );

    const songIds = response.data.songs.map((song) => song.id);

    lofiPlaylist.quedPlaylist = songIds;
    lofiPlaylist.cuedPlaylistData = response.data.songs;

    e.target.disabled = false;
  } catch (err) {
    displayAlert('danger', `Internal error occured trying to generate playlist: ${err.message}`);
    console.log('Error getting discover songs: ', err.message);
    e.target.disabled = false;
  }
});

favoriteButton.addEventListener('click', async (e) => {
  try {
    const { videoId } = e.target.dataset;
    const favoritesPlaylistId = favoritesPlaylist.dataset.playlistId;
    const favoritesPlaylistSongNum = favoritesPlaylist.querySelector(
      '.playlist-songs-num'
    );
    const numOfFavoriteSong = parseInt(
      favoritesPlaylistSongNum.textContent.split(' ')[0]
    );

    const response = await addSongToPlaylist(favoritesPlaylistId, videoId);

    if (!response.error) {
      favoritesPlaylistSongNum.textContent = `${numOfFavoriteSong + 1} songs`;
      displayAlert('success', 'Added to Favorites!');
    } else {
      displayAlert('warning', `Failed to add song to Favorites: ${response.error}`);
    }
  } catch (err) {
    displayAlert('danger', `Internal error occurred while adding song to Favorites: ${err.message}`);
  }
});

newPlaylistButton.addEventListener('click', () => {
  toggleGreyedOutBackground();
  toggleClass(newPlaylistModel, 'd-none')
});

cancelCreateButton.addEventListener('click', () => {
  toggleGreyedOutBackground();
  addClasses(newPlaylistModel, 'd-none')

  playlistNameInput.value = '';
});

newPlaylistModel.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const response = await createPlaylist(playlistNameInput.value);

    if (!response.error) {
      const { id, name } = response.data.playlist;

      const playlistContainer = document.querySelector(
        '.playlist-items-container'
      );
      const playlistItem = document.createElement('div');
      const playlistName = document.createElement('div');
      const playlistOption = document.createElement('option');
      const playlistSongNum = document.createElement('div');

      playlistItem.dataset.playlistId = id;
      playlistItem.dataset.playlistName = name;
      playlistItem.className = 'playlist-item';

      playlistName.className = 'playlist-name';
      playlistName.textContent = name;

      playlistOption.value = id;
      playlistOption.textContent = name;

      playlistSongNum.textContent = '0 songs';
      playlistSongNum.className = 'playlist-songs-num';

      playlistItem.append(playlistName, playlistSongNum);
      playlistContainer.append(playlistItem);
      addToPlaylistSelect.append(playlistOption);

      addFunctionalityToPlaylists([playlistItem]);
      displayAlert('success', 'Playlist Created!')
    } else {
      displayAlert('warning', `Failed to create playlist: ${response.error}`)
    }
  } catch (err) {
    displayAlert('danger', `Internal error occurred while creating playlist: ${err.message}`);
    console.log('Error trying to create playlist: ', err.message);
  } finally {
    playlistNameInput.value = '';
    addClasses(newPlaylistModel, 'd-none')
    toggleGreyedOutBackground();
  }
});

renamePlaylistModal.addEventListener('submit', async (e) => {
  e.preventDefault();

  const playlistId = e.submitter.dataset.playlistId;
  const playlistElement = document.querySelector(
    `[data-playlist-id='${playlistId}']`
  );

  try {
    const response = await renamePlaylist(
      playlistId,
      newPlaylistNameInput.value
    );

    console.log('response renaming playlist: ', response);

    if (!response.error) {
      playlistElement.dataset.playlistName = newPlaylistNameInput.value;
      playlistElement.querySelector('.playlist-name').textContent =
        newPlaylistNameInput.value;

      // update playlist options in select
      addToPlaylistSelect.querySelector(`[value='${playlistId}']`).textContent =
        newPlaylistNameInput.value;
      displayAlert('success', 'Playlist Renamed!');
    } else {
      displayAlert('warning', `Failed to rename playlist: ${response.error}`);
    }
  } catch (err) {
    displayAlert('danger', `Internal error occurred while renaming playlist: ${err.message}`);
    console.log('Internal Error updating playlist name: ', err.message);
  } finally {
    newPlaylistNameInput.value = '';
    addClasses(renamePlaylistModal, 'd-none')
    toggleGreyedOutBackground();
  }
});

cancelRenameButton.addEventListener('click', () => {
  toggleGreyedOutBackground();
  toggleClass(renamePlaylistModal, 'd-none')
});

addFunctionalityToPlaylists(playlistEntries);
addFunctionalityToPlaylistSelect(addToPlaylistSelect);
