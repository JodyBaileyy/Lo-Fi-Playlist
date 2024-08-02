import {
  renamePlaylist,
  fetchDiscoverySongs,
  addSongToPlaylist,
  createPlaylist,
} from './queries.js';
import {
  addClasses,
  toggleClass,
  removeElement,
  replaceClass,
} from './utils.js';
import { unfilliedHeartIconClass, filledHeartIconClass } from './constants.js';
import { lofiPlaylist, player } from './player.js';
import {
  toggleGreyedOutBackground,
  displayAlert,
  createLoadingSpinner,
  addGeneratedPlaylist,
  createNewPlaylist,
  addFunctionalityToPlaylists,
  addFunctionalityToPlaylistSelect,
} from './helpers.js';

const initRenamePlaylistModal = () => {
  const renamePlaylistModal = document.querySelector('.rename-playlist-modal');
  const newPlaylistNameInput = document.querySelector('.new-name-input');
  const addToPlaylistSelect = document.querySelector('.add-to-playlist');

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

      if (!response.error) {
        playlistElement.dataset.playlistName = newPlaylistNameInput.value;
        playlistElement.querySelector('.playlist-name').textContent =
          newPlaylistNameInput.value;

        // update playlist options in select
        addToPlaylistSelect.querySelector(
          `[value='${playlistId}']`
        ).textContent = newPlaylistNameInput.value;
        displayAlert('success', 'Playlist Renamed!');
      } else {
        displayAlert('warning', `Failed to rename playlist: ${response.error}`);
      }
    } catch (err) {
      displayAlert(
        'danger',
        `Internal error occurred while renaming playlist: ${err.message}`
      );
      console.log('Internal Error updating playlist name: ', err);
    } finally {
      newPlaylistNameInput.value = '';
      addClasses(renamePlaylistModal, 'd-none');
      toggleGreyedOutBackground();
    }
  });
};

const initBackToPlaylistButton = () => {
  const backToPlaylists = document.querySelector('#back-to-playlists-btn');
  const playlistContainer = document.querySelector('.playlist-container');
  const playlistSongsContainer = document.querySelector('.playlist-songs-container');

  backToPlaylists.addEventListener('click', () => {
    toggleClass(playlistContainer, 'd-none');
    toggleClass(playlistSongsContainer, 'd-none');
  });
};

const initDiscoverSongsButton = () => {
  const dicoverSongsButton = document.querySelector('.discover-lofi-songs-btn');
  const discoverSongsContainer = document.querySelector('.discover-lofi-songs-container');

  dicoverSongsButton.addEventListener('click', async () => {
    const spinner = createLoadingSpinner();

    try {
      discoverSongsContainer.appendChild(spinner);
      toggleClass(dicoverSongsButton, 'd-none');

      const existingPlaylist = document.querySelector(".playlist-item[data-playlist-name='Made for You']");

      if (existingPlaylist) {
        removeElement(existingPlaylist);
      }

      const response = await fetchDiscoverySongs();
      const songIds = response.data.songs.map((song) => song.id);

      lofiPlaylist.generatedPlaylist = songIds;
      lofiPlaylist.generatedPlaylistData = response.data.songs;

      addGeneratedPlaylist('Made for You');

      removeElement(spinner);
      toggleClass(dicoverSongsButton, 'd-none');
    } catch (err) {
      displayAlert('danger', `Internal error occured trying to generate playlist: ${err.message}`);
      console.log('Error getting discover songs: ', err);

      removeElement(spinner);
      toggleClass(dicoverSongsButton, 'd-none');
    }
  });
};

const initFavoriteButton = () => {
  const favoriteButton = document.querySelector('#favorite');
  const favoritesPlaylist = document.querySelector('.playlist-item[data-playlist-name="Favorites"]');

  favoriteButton.addEventListener('click', async () => {
    try {
      const { videoId } = favoriteButton.dataset;
      const favoritesPlaylistId = favoritesPlaylist.dataset.playlistId;
      const favoritesIcon = favoriteButton.querySelector(`.${unfilliedHeartIconClass}`);
      const favoritesPlaylistSongNum = favoritesPlaylist.querySelector('.playlist-songs-num');
      const numOfFavoriteSong = parseInt(favoritesPlaylistSongNum.textContent.split(' ')[0]);

      const response = await addSongToPlaylist(favoritesPlaylistId, videoId);

      if (!response.error) {
        favoritesPlaylistSongNum.textContent = `${numOfFavoriteSong + 1} songs`;
        replaceClass(favoritesIcon, unfilliedHeartIconClass, filledHeartIconClass);
        displayAlert('success', 'Added to Favorites!');
      } else {
        displayAlert('warning', `Failed to add song to Favorites: ${response.error}`);
      }
    } catch (err) {
      displayAlert('danger', `Internal error occurred while adding song to Favorites: ${err.message}`);
    }
  });
};

const initPlayPlaylistButton = () => {
  const playPlaylistButton = document.querySelector('.play-playlist-btn');

  playPlaylistButton.addEventListener('click', () => {
    if (lofiPlaylist.quedPlaylist.length === 0) return;

    if (!lofiPlaylist.quedPlaylistIsPlaying()) {
      lofiPlaylist.updatePlaylist(0);
    } else {
      player.playVideoAt(0);
    }
  });
};

const initNewPlaylistButton = () => {
  const newPlaylistButton = document.querySelector('.new-playlist-btn');
  const newPlaylistModel = document.querySelector('.new-playlist-modal');

  newPlaylistButton.addEventListener('click', () => {
    toggleGreyedOutBackground();
    toggleClass(newPlaylistModel, 'd-none');
  });
};

const initCancelRenameButton = () => {
  const cancelRenameButton = document.querySelector('.cancel-rename');
  const renamePlaylistModel = document.querySelector('.rename-playlist-modal');
  const newNameInput = document.querySelector('.new-name-input');

  cancelRenameButton.addEventListener('click', () => {
    toggleGreyedOutBackground();
    addClasses(renamePlaylistModel, 'd-none');

    newNameInput.value = '';
  });
};

const initCancelCreateButton = () => {
  const cancelCreateButton = document.querySelector('.cancel-create');
  const newPlaylistModel = document.querySelector('.new-playlist-modal');
  const playlistNameInput = document.querySelector('.name-input');

  cancelCreateButton.addEventListener('click', () => {
    toggleGreyedOutBackground();
    addClasses(newPlaylistModel, 'd-none');

    playlistNameInput.value = '';
  });
};

const initNewPlaylistModal = () => {
  const newPlaylistModel = document.querySelector('.new-playlist-modal');
  const playlistNameInput = document.querySelector('.name-input');

  newPlaylistModel.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const response = await createPlaylist(playlistNameInput.value);

      if (!response.error) {
        const { id, name } = response.data.playlist;

        createNewPlaylist({ id, name });
      } else {
        displayAlert('warning', `Failed to create playlist: ${response.error}`);
      }
    } catch (err) {
      displayAlert('danger', `Internal error occurred while creating playlist: ${err.message}`);
      console.log('Error trying to create playlist: ', err);
    } finally {
      playlistNameInput.value = '';
      addClasses(newPlaylistModel, 'd-none');
      toggleGreyedOutBackground();
    }
  });
};

const initPlaylists = () => {
  const playlistEntries = document.querySelectorAll('.playlist-item');

  addFunctionalityToPlaylists(playlistEntries);
};

const initPlaylistSelect = () => {
  const addToPlaylistSelect = document.querySelector('.add-to-playlist');

  addFunctionalityToPlaylistSelect(addToPlaylistSelect);
};

export const init = () => {
  initBackToPlaylistButton();
  initDiscoverSongsButton();
  initFavoriteButton();
  initNewPlaylistButton();
  initCancelCreateButton();
  initCancelRenameButton();
  initNewPlaylistModal();
  initRenamePlaylistModal();
  initPlaylists();
  initPlaylistSelect();
  initPlayPlaylistButton();
};
