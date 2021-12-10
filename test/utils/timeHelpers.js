const nowInSeconds = () => {
  return Date.now() / 1000;
};

// eslint-disable-next-line promise/param-names
const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  nowInSeconds,
  delay,
};
