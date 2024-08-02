import {
  playIconClass,
  pauseIconClass,
  nextIconClass,
  unfilliedHeartIconClass,
  filledHeartIconClass,
  deleteIconClass,
  addToPlaylistIconClass,
  backIconClass,
  renameIconClass,
} from './constants.js';

export const replaceClass = (element, oldClass, newClass) => {
  if (!element) return;

  element.classList.replace(oldClass, newClass);
};

export const removeClasses = (element, ...classes) => {
  if (!element) return;

  element.classList.remove(...classes);
};

export const addClasses = (element, ...classes) => {
  if (!element) return;

  element.classList.add(...classes);
};

export const toggleClass = (element, className) => {
  if (!element) return;

  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
};

export const removeElement = (element) => {
  if (!element) return;

  element.remove();
};

export const convertToPlayerFormat = (time) => {
  if (!time) return '0:00';

  let seconds, minutes, hours = 0;

  hours = Math.floor(time / 3600);
  minutes = Math.floor((time - hours * 3600) / 60);
  seconds = Math.floor(time - hours * 3600 - minutes * 60);

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  if (hours === 0) {
    return `${minutes}:${seconds}`;
  }

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  return `${hours}:${minutes}:${seconds}`;
};

export const getIcon = (name, size) => {
  const iconElement = document.createElement('i');

  // The smaller the size argument, the larger the size of the icon
  addClasses(iconElement, `fs-${size}`, 'bi');

  switch (name.toLowerCase()) {
    case 'play':
      addClasses(iconElement, playIconClass);
      break;
    case 'pause':
      addClasses(iconElement, pauseIconClass);
      break;
    case 'previous':
      addClasses(iconElement, pauseIconClass);
      break;
    case 'next':
      addClasses(iconElement, nextIconClass);
      break;
    case 'delete':
      addClasses(iconElement, deleteIconClass);
      break;
    case 'add':
      addClasses(iconElement, addToPlaylistIconClass);
      break;
    case 'heartUnfilled':
      addClasses(iconElement, unfilliedHeartIconClass);
      break;
    case 'heartFilled':
      addClasses(iconElement, filledHeartIconClass);
      break;
    case 'back':
      addClasses(iconElement, backIconClass);
      break;
    case 'rename':
      addClasses(iconElement, renameIconClass);
      break;
  }

  return iconElement;
};
