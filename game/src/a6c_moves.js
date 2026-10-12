// ================= jump, water stride, wings (STUB: the abilities build replaces this file)
// Contract: player.z (height in px), player.vz, player.flying, player.onWater. grantAbility('jump'|'stride'|'wings').
function grantAbility(id){ G.abil=G.abil||{}; G.abil[id]=true; setBanner(id,'New ability',2); }
function canWalkWater(){ return hasAbil('stride'); }
function drawWingsHook(p,L,fl){}
function drawMoveHud(){}
function drawAirborneHook(){ if(player&&player.flying&&!player.dead) drawPlayer(); }  // world space, after trees and flying enemies
