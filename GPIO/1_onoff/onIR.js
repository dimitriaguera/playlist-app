/* -----------------------------------------------------------------------------
Programme classique LED clignotante
Led rouge sur GPIO23 via une résistance de 330 ohms
os                  : RPi Linux 4.4.13+ (Jessie)
logiciel            : node v0.12.6
cible               : raspberry Pi
date de création    : 26/06/2016
date de mise à jour : 20/07/2016
version             : 1.0
auteur              : icarePetibles
référence           : https://www.npmjs.com/package/onoff
Remarques           :
----------------------------------------------------------------------------- */
let Gpio = require('onoff').Gpio;     //module onoff

let led = new Gpio(21, 'out');         //led sur GPIO23 et en sortie

DUREE = 500;                      //demi-période clignotement (msec)

console.log('Début programme led clignotante');
console.log("'Sortie de la boucle infinie par ctrl+c'");

//IHM
var iv = setInterval(function(){       //appel toutes les x milli-sec
  led.writeSync(led.readSync() === 0 ? 1 : 0)
}, DUREE);                               //durée de répétition

function exit(){                       //sortie de la boucle infinie
  clearInterval(iv);                 //arrêt clignotement
  led.writeSync(0);                  //éteint led
  led.unexport();                    //unexport GPIO et libère la resssource
  console.log('\nFin programme');    //IHM
  process.exit();                    //arrêt node
}
process.on('SIGINT', exit);            //capture du ^C et exécute exit()