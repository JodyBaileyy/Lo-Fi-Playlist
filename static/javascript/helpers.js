import { lofiPlaylist, player } from './player.js';
import {
  replaceClass,
  addClasses,
  removeClasses,
  toggleClass,
  getIcon,
} from './utils.js';
import {
  fetchAllPlaylists,
  fetchPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  deletePlaylistSong,
} from './queries.js';
import {
  pauseIconClass,
  playIconClass,
  playingSongBorderClass,
  filledHeartIconClass,
  unfilliedHeartIconClass,
  PLAYING,
} from './constants.js';

export const handleNewSongLoad = (newSongId) => {
  // Changes:
  // - The previously playing songs icon to a play icon, and change the playing songs icon to a paused icon
  // - Removes the previously playing songs border class, and adds the border class to the new playing song
  // - Updated the widget with the new playing song's info
  // - Set favorites icon to an unfilled heart, if it was previously filled in (previous song was favorited)

  const isFirstLoad = !lofiPlaylist.playingSong;
  const favoriteSongButton = document.querySelector('#favorite');
  const favoriteSongIcon = favoriteSongButton.firstElementChild;
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

  const { title, thumbnail, duration } = lofiPlaylist.playingSongData;

  playerSongThumbnail.src = thumbnail;
  playerSongThumbnail.alt = `${title} thumbnail.`;

  playerSongTotalTime.textContent = duration;
  playerSongTitle.textContent = title;
  playerSongTitle.title = title;

  if (isFirstLoad) {
    handleFirstLoad();
  }

  if (favoriteSongIcon.classList.contains(filledHeartIconClass)) {
    replaceClass(favoriteSongIcon, filledHeartIconClass, unfilliedHeartIconClass);
  }

  lofiPlaylist.createPlayingSongInterval();
};

export const createLoadingSpinner = () => {
  const spinner = document.createElement('img');

  addClasses(spinner, 'loading-spinner-img');
  spinner.alt = 'loading spinner icon.';
  spinner.src = '/static/images/loading.svg';

  return spinner;
};

export const handleFirstLoad = () => {
  const youtubeVideoContainer = document.querySelector('.yt-video-container');
  const playerWidget = document.querySelector('.player-widget');

  removeClasses(youtubeVideoContainer, 'd-none');
  removeClasses(playerWidget, 'd-none');
};

export const toggleGreyedOutBackground = () => {
  const greyedOutBackground = document.querySelector('.greyed-out-background');

  toggleClass(greyedOutBackground, 'd-none');
};

export const getPlayingPlaylistSongElements = (songId) => {
  const playlistSong = document.querySelector(`.playlist-song[data-video-id='${songId}']`);
  const toggleSongButton = playlistSong?.querySelector('.play-playlist-song-btn');

  return {
    playlistSong,
    toggleSongButton,
  };
};

const addClickAndEnterEventListeners = (element, eventHandler) => {
  ['click', 'keydown'].forEach((event) => {
    element.addEventListener(event, (e) => {
      const enterEvent = e.type === 'keydown' && e.key === 'Enter';

      e.stopPropagation();

      if (e.target !== element && enterEvent) return;
      if (e.type === 'click' || enterEvent) {
        eventHandler();
      }
    });
  });
};

const getPlayerInfoElements = () => {
  const playerSongThumbnail = document.querySelector('.player-song-thumbnail');
  const playerSongTitle = document.querySelector('.player-song-title');
  const playerSongTotalTime = document.querySelector('.player-song-total-time');

  return {
    playerSongThumbnail,
    playerSongTitle,
    playerSongTotalTime,
  };
};

const createPlaylistSelectContainer = (playlists, songId, songName) => {
  const container = document.createElement('div');
  const select = document.createElement('select');
  const defaultSelectOption = document.createElement('option');
  const addButton = document.createElement('button');
  const addIcon = getIcon('add', 5);

  addClasses(container, 'song-playlist-select-container', 'position-relative', 'align-self-center','scale-hover-3');
  addClasses(addButton, 'btn', 'song-add-to-playlist-btn');
  addClasses(select, 'playlist-select', 'icon-button', 'position-absolute');

  addButton.append(addIcon);
  select.append(defaultSelectOption);

  addButton.ariaLabel = `add song ${songName} to playlist`;
  addButton.tabIndex = -1;

  defaultSelectOption.disabled = true;
  defaultSelectOption.textContent = '--';
  defaultSelectOption.selected = true;

  select.dataset.videoId = songId;
  select.ariaLabel = 'Add song to playlist';
  select.tabIndex = 0;
  addFunctionalityToPlaylistSelect(select);

  playlists.forEach((playlist) => {
    const option = document.createElement('option');

    option.value = playlist.id;
    option.textContent = playlist.name;

    select.append(option);
  });

  container.append(addButton, select);

  return container;
};

export const displayAlert = (level, text) => {
  const alertContainer = document.querySelector('.playlist-alert-container');
  const alert = document.createElement('div');
  const alertText = document.createElement('div');
  const clostAlertButton = document.createElement('button');

  addClasses(clostAlertButton, 'btn-close');
  addClasses(alert, 'playlist-alert', 'alert', 'alert-dismissible', `alert-${level}`, 'position-sticky', 'fade', 'show', 'text-center');

  clostAlertButton.type = 'button';
  clostAlertButton.dataset.bsDismiss = 'alert';
  clostAlertButton.ariaLabel = 'Close alert';

  alertText.textContent = text;

  alert.role = 'alert';
  alert.append(alertText, clostAlertButton);

  alertContainer.append(alert);

  // Close the alert after 8 seconds
  setTimeout(() => {
    clostAlertButton.click();
  }, 8000);
};

const addFunctionalityToSong = (index, songId) => {
  if (!lofiPlaylist.quedPlaylistIsPlaying()) {
    lofiPlaylist.updatePlaylist(index, songId);
  } else {
    // If player isn't already playing the song we're working with
    if (player.playerInfo.playlistIndex !== index) {
      player.playVideoAt(index);
    } else if (player.getPlayerState() === PLAYING) {
      // if already playing the song, pause or play the song
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }
};

// Helper for adding playlist songs to the page
const renderPlaylistSongs = async (name, songs, playlistId = null) => {
  let playlistData;

  const playlistSongsContainer = document.querySelector('.playlist-songs-container');
  const playlistSongs = playlistSongsContainer.querySelectorAll('.playlist-song');
  const backToPlaylists = document.querySelector('#back-to-playlists-container');
  const playlistHeader = document.querySelector('.playlist-header');
  const playlistContainer = document.querySelector('.playlist-container');
  const playlistTitle = document.querySelector('.playlist-header-title');

  // Get playlist data for "add to playlist" select element for the playlist song
  try {
    const response = await fetchAllPlaylists();

    playlistData = response.data.playlists;
  } catch (err) {
    displayAlert('danger', `Internal error occurred trying to fetch playlists: ${err.message}`);
    console.log('Failed to fetch playlists for select element: ', err);
  }

  playlistSongs.forEach((playlistSong) => {
    playlistSongsContainer.removeChild(playlistSong);
  });

  playlistTitle.textContent = name;
  playlistSongsContainer.append(backToPlaylists, playlistHeader);

  songs.forEach((song, index) => {
    const playlistSongElement = document.createElement('li');
    const playlistSongTitle = document.createElement('div');
    const playlistDuration = document.createElement('div');
    const playSongButton = document.createElement('button');
    const playlistThumbnail = document.createElement('img');
    const playlistInfoContainer = document.createElement('div');

    addClasses(playlistSongTitle, 'playlist-song-title', 'text-truncate');
    addClasses(playlistDuration, 'playlist-song-duration');
    addClasses(playSongButton, 'play-playlist-song-btn', 'icon-button', 'btn', 'scale-hover-3');
    addClasses(playlistThumbnail, 'playlist-song-thumbnail', 'rounded');
    addClasses(playlistInfoContainer, 'playlist-info-container', 'd-flex', 'flex-column', 'px-3', 'justify-content-center', 'me-auto', 'text-truncate');
    addClasses(playlistSongElement,'playlist-song', 'd-flex', 'py-4', 'my-1', 'scale-hover-1');

    // If rendering the playing song
    if (lofiPlaylist.playingSong === song.id) {
      addClasses(playlistSongElement, 'playing-song-border');
    }

    const playSongIcon = getIcon('play', 2);
    const playlistSelectContainer = createPlaylistSelectContainer(playlistData, song.id, song.title);

    playlistSongTitle.textContent = song.title;
    playlistSongTitle.title = song.title;
    playlistDuration.textContent = song.duration;

    playSongButton.ariaLabel = `play song ${song.title}`;
    playSongButton.dataset.videoId = song.id;
    playSongButton.appendChild(playSongIcon);

    playlistThumbnail.src = song.thumbnail;
    playlistThumbnail.alt = `${song.title} thumbnail.`;

    playlistInfoContainer.append(playlistSongTitle, playlistDuration);

    playlistSongElement.dataset.videoId = song.id;
    playlistSongElement.tabIndex = 0;
    addClickAndEnterEventListeners(playlistSongElement, () => addFunctionalityToSong(index, song.id));

    const playlistSongElementChildren = [
      playSongButton,
      playlistThumbnail,
      playlistInfoContainer,
      playlistSelectContainer,
    ];

    // If working with a playlist that was created by the user and not generated
    if (playlistId) {
      const deleteSongButton = document.createElement('button');

      addClasses(deleteSongButton, 'delete-playlist-song-btn', 'icon-button', 'btn', 'scale-hover-3');
      deleteSongButton.ariaLabel = `delete song ${song.title} from playlist ${name}`;
      deleteSongButton.append(getIcon('delete', 5));
      deleteSongButton.addEventListener('click', async (e) => {
        e.stopPropagation();

        try {
          const response = await deletePlaylistSong(song.id, playlistId);
          const playlistSongsNum = document
            .querySelector(`[data-playlist-id='${playlistId}']`)
            .querySelector('.playlist-songs-num');

          if (!response.error) {
            playlistSongsContainer.removeChild(playlistSongElement);
            playlistSongsNum.textContent = `${parseInt(playlistSongsNum.textContent) - 1} songs`;

            displayAlert('success', 'Song Deleted!');
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

  toggleClass(playlistContainer, 'd-none');
  toggleClass(playlistSongsContainer, 'd-none');
};

const addFunctionalityToPlaylist = async (playlist, name) => {
  try {
    playlist.style.pointerEvents = 'none';
    toggleClass(playlist, 'loading-gradient-background');
    toggleClass(playlist, 'scale-hover-1');

    const response = await fetchPlaylist(playlist.dataset.playlistId);

    if (!response.error) {
      renderPlaylistSongs(name, response.data.songs, playlist.dataset.playlistId);

      const songIds = response.data.songs.map((song) => song.id);

      lofiPlaylist.quedPlaylist = songIds;
      lofiPlaylist.cuedPlaylistData = response.data.songs;

      playlist.style.pointerEvents = 'auto';
      toggleClass(playlist, 'loading-gradient-background');
      toggleClass(playlist, 'scale-hover-1');
    } else {
      displayAlert('warning', `Failed to load playlist: ${response.error}`);
      playlist.style.pointerEvents = 'auto';
      toggleClass(playlist, 'loading-gradient-background');
      toggleClass(playlist, 'scale-hover-1');
    }
  } catch (err) {
    displayAlert('danger', `Internal error occured trying to load playlist: ${err.message}`);
    console.log('Error getting playlist songs: ', err);

    playlist.style.pointerEvents = 'auto';
    toggleClass(playlist, 'loading-gradient-background');
    toggleClass(playlist, 'scale-hover-1');
  }
};

const addFunctionalityToRenamePlaylistButton = (playlist) => {
  const renamePlaylistModal = document.querySelector('.rename-playlist-modal');
  const confirmRename = document.querySelector('.confirm-rename');
  const newPlaylistNameInput = document.querySelector('.new-name-input');

  toggleGreyedOutBackground();
  toggleClass(renamePlaylistModal, 'd-none');

  confirmRename.dataset.playlistId = playlist.dataset.playlistId;
  newPlaylistNameInput.focus();
};

const addFunctionalityToDeletePlaylistButton = async (playlist) => {
  const addToPlaylistSelect = document.querySelector('.add-to-playlist');
  const playlistContainer = playlist.parentElement;

  try {
    const response = await deletePlaylist(playlist.dataset.playlistId);

    if (!response.error) {
      // Remove option in playlist select and remove playlist
      const optionElement = addToPlaylistSelect.querySelector(
        `[value='${playlist.dataset.playlistId}']`
      );

      addToPlaylistSelect.removeChild(optionElement);
      playlistContainer.removeChild(playlist);
      displayAlert('success', 'Playlist Deleted!');
    } else {
      displayAlert('warning', `Failed to delete playlist: ${response.error}`);
    }
  } catch (err) {
    displayAlert('danger', `Internal error occured trying to delete playlist: ${err.message}`);
    console.log('error occured trying to delete playlist: ', err);
  }
};

export const addFunctionalityToPlaylists = (playlists) => {
  playlists.forEach((playlist) => {
    const playlistName = playlist.querySelector('.playlist-name');

    // Load the playlist songs
    addClickAndEnterEventListeners(playlist, () =>
      addFunctionalityToPlaylist(playlist, playlistName.innerText)
    );

    // Add button to delete + rename playlist if playlist isn't the favorites playlist
    if (playlist.dataset.playlistName !== 'Favorites') {
      const deletePlaylistButton = document.createElement('button');
      const renameButton = document.createElement('button');
      const playlistButtonsContainer = playlist.querySelector(
        '.playlist-item-btns-container'
      );

      addClasses(renameButton, 'rename-playlist-btn', 'icon-button', 'btn', 'scale-hover-3');
      addClasses(deletePlaylistButton, 'delete-playlist-btn', 'icon-button', 'btn', 'scale-hover-3');

      renameButton.ariaLabel = `rename playlist ${playlist.dataset.playlistName}.`;
      renameButton.append(getIcon('rename', 5));
      renameButton.addEventListener('click', (e) => {
        e.stopPropagation();

        addFunctionalityToRenamePlaylistButton(playlist);
      });

      deletePlaylistButton.ariaLabel = `delete playlist ${playlist.dataset.playlistName}.`;
      deletePlaylistButton.append(getIcon('Delete', 5));
      deletePlaylistButton.addEventListener('click', (e) => {
        e.stopPropagation();

        addFunctionalityToDeletePlaylistButton(playlist);
      });

      playlistButtonsContainer.append(renameButton, deletePlaylistButton);
    }
  });
};

export const addFunctionalityToPlaylistSelect = (select) => {
  select.addEventListener('click', (e) => {
    e.stopPropagation();
  });

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
        playlistSongNum.textContent = `${numberofSongs + 1} ${
          numberofSongs + 1 == 1 ? 'song' : 'songs'
        }`;
        displayAlert('success', 'Added to playlist!');
      } else {
        displayAlert('warning', `Failed to add song to playlist: ${response.error}`);
      }
    } catch (err) {
      displayAlert('danger', `Internal error occurred while adding song to playlist: ${err.message}`);
    }
  });
};

export const addGeneratedPlaylist = (name) => {
  const playlistItem = createNewPlaylist({name, songsNum: lofiPlaylist.generatedPlaylist.length});

  playlistItem.addEventListener('click', () => {
    renderPlaylistSongs(name, lofiPlaylist.generatedPlaylistData);

    lofiPlaylist.quedPlaylist = lofiPlaylist.generatedPlaylist;
    lofiPlaylist.cuedPlaylistData = lofiPlaylist.generatedPlaylistData;
  });
};

export const createNewPlaylist = ({ id, name, songsNum }) => {
  const playlistContainer = document.querySelector('.playlist-items-container');
  const playlistItem = document.createElement('li');
  const playlistName = document.createElement('div');
  const playlistSongNum = document.createElement('div');
  const playlistButtonsContainer = document.createElement('div');
  const playlistDetailsContainer = document.createElement('div');
  const addToPlaylistSelect = document.querySelector('.add-to-playlist');

  addClasses(playlistItem, 'playlist-item', 'd-flex', 'justify-content-between', 'rounded', 'scale-hover-1');
  addClasses(playlistName, 'playlist-name', 'text-truncate');
  addClasses(playlistSongNum, 'playlist-songs-num');
  addClasses(playlistDetailsContainer, 'playlist-item-details-container', 'text-truncate');
  addClasses(playlistButtonsContainer, 'playlist-item-btns-container', 'd-flex');

  playlistItem.tabIndex = 0;
  playlistItem.dataset.playlistName = name;
  playlistName.textContent = name;
  playlistName.title = name;
  playlistSongNum.textContent = songsNum ? `${songsNum} songs` : '0 songs';

  playlistDetailsContainer.append(playlistName, playlistSongNum);
  playlistItem.append(playlistDetailsContainer, playlistButtonsContainer);
  playlistContainer.append(playlistItem);

  // If playlist is an existing playlist and not a generated one
  if (id) {
    const playlistOption = document.createElement('option');

    playlistItem.dataset.playlistId = id;
    addClasses(playlistItem, 'blue-border', 'existing-playlist');

    playlistOption.value = id;
    playlistOption.textContent = name;
    addToPlaylistSelect.append(playlistOption);
    addFunctionalityToPlaylists([playlistItem]);
  } else {
    addClasses(playlistItem, 'gradient-border', 'generated-playlist');
  }

  displayAlert('success', 'Playlist Created!');

  return playlistItem;
};
