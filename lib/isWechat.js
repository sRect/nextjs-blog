export default function isWechat(userAgent) {
  let ua = userAgent || navigator.userAgent;
  ua = ua.toLowerCase();

  if (ua.match(/MicroMessenger/i) == "micromessenger") {
    return true;
  } else {
    return false;
  }
}
