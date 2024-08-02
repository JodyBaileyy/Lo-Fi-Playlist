import { UNSTARTED, PLAYING, PAUSED, VIDEOCUED } from './constants.js';
import { getPlayingPlaylistSongElements, handleNewSongLoad } from './helpers.js';
import { addSongToListenedList } from "./queries.js";
import { convertToPlayerFormat, replaceClass } from './utils.js';
import { pauseIconClass, playIconClass } from './constants.js';

class Playlist {
  constructor() {
    this.playingPlaylist = [];
    this.quedPlaylist = [];
    this.cuedPlaylistData = [];
    this.playlingPlaylistData = [];
    this.generatedPlaylist = [];
    this.generatedPlaylistData = [];
    this.loadingNewPlaylistSong = false;
    this.playingSongInterval = null;
    this.playingSong = null;
  }
    
  quedPlaylistIsPlaying() {
    return this.playingPlaylist === this.quedPlaylist;
  }
  
    // For race conditions when the player needs to get up to date to play the video at the specified index
  updatePlaylist(index, songId = this.quedPlaylist[0]) {
    this.loadingNewPlaylistSong = true;
    this.playlingPlaylistData = this.cuedPlaylistData;
    this.playingPlaylist = this.quedPlaylist;

    player.cuePlaylist(lofiPlaylist.quedPlaylist);
        
    setTimeout(() => {
      player.playVideoAt(index);
      handleNewSongLoad(songId);
        
      this.loadingNewPlaylistSong = false;
    }, 1500)
  }
  
  createPlayingSongInterval() {
    this.playingSongInterval = setInterval(async () => {
      const percentageListened = player.getCurrentTime() / player.getDuration() * 100;

      // If songs has been playing for >=10% of its total duration, mark the song as listened
      if (percentageListened >= 10) {
        try {
          await addSongToListenedList(this.playingSong);
        } catch (err) {
          console.log('error occured adding song to listened list: ', err);
        } finally {
          clearInterval(this.playingSongInterval);
        }
      }
    }, 1000)
  }
  
  get playingSongData() {
    return this.playlingPlaylistData.find((song) => {
      return song.id === this.playingSong;
    })
  }
}

let player;
const lofiPlaylist = new Playlist();

const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    playerVars: {
      rel: 0,
      autoplay: 0,
      controls: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
}

function onPlayerError() {
  displayAlert('danger', 'Failed to play song');
}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
  const nextButton = document.querySelector('#next');
  const previousButton = document.querySelector('#previous');
  const pausePlayButton = document.querySelector('#play-pause');
  const playerElapsedTime = document.querySelector('.player-elapsed-time');

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
    playerElapsedTime.textContent = convertToPlayerFormat(
      player.getCurrentTime()
    );
  }, 1000);
}

// The API calls this function when the player's state changes.
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

// Allow for the method to be called by the window when the api code is downloaded
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

export { player, lofiPlaylist }
