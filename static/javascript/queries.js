export const addSongToListenedList = async (songId) => {
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

export const fetchAllPlaylists = async () => {
  try {
    const response = await fetch('/playlists');

    return await response.json();
  } catch (err) {
    return err;
  }
};

export const deletePlaylistSong = async (songId, playlistId) => {
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

export const deletePlaylist = async (playlistId) => {
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

export const fetchDiscoverySongs = async () => {
  try {
    const response = await fetch('/discover');

    return await response.json();
  } catch (err) {
    return err;
  }
};

export const fetchPlaylist = async (id) => {
  try {
    const response = await fetch(`/playlist/${id}`);

    return await response.json();
  } catch (err) {
    return err;
  }
};

export const createPlaylist = async (name) => {
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

export const addSongToPlaylist = async (playlistId, songId) => {
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

export const renamePlaylist = async (playlistId, name) => {
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
