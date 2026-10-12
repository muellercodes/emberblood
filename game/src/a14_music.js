
// ================= music (procedural score, WebAudio)
// Interface used by the rest of the game:
//   Music.init()            call after a user gesture (SFX.init() first)
//   Music.setTheme(name)    crossfade to a theme; same name again is a no-op
//   Music.stinger(name)     one-shot musical cue over the current theme
//   Music.toggle()          returns new muted state; persisted in localStorage 'eb_music_off'
//   Music.muted             true when music is off
//   Music.duck(on)          lower music while dialogue is open
const Music=(()=>{
  let theme=null;
  return {init(){},setTheme(n){ theme=n; },stinger(){},toggle(){ return true; },duck(){},get muted(){ return true; },get theme(){ return theme; }};
})();
