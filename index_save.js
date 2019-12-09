const sslCertificate = require('get-ssl-certificate')

console.log("Pour récupérer la liste des URLs des clients Mindfruits,\n aller à l'url suivante: https://docs.google.com/spreadsheets/d/1fGeceHZvKXRxLq1qu2-QWUIZxkMwLub-mZOQNMxgOio/edit#gid=836304774\nOuvrir l'éditeur de script, lancer la myFunction(), afficher les logs et y récupérer la liste des urls sous forme d'un array.\nPar contre, le array récupéré ne sera pas dans le bon format, il faudra reformater le array récupéré via ce log de myFunction():\n- supprimer les 'http://''\n- supprimer les '/' à la fin des urls\n- (et p^t autre chose)");
const listeClients = [ "www.admobili.fr",  "www.allomat.fr",  "www.axxis-ressources.com", "www.betty-boots.fr",  "www.le-defibrillateur.com", "www.cookson-clal.com", "www.cyalume.eu", "www.digifirstconsulting.com",    "www.ksd-expertises.fr", "www.lagrandeboutique.net",    "manageo-data-agency.com",  " www.valdallos.com",     "www.riluxa.com", "www.boutiques-sevens.com",   "www.tourmag.com"]
console.log(listeClients.length);
const soon = 15
const today = new Date()
let listeClientNonValides = []
let listeClientBientotNonValides = []
let done = 0
new Promise((res, rej) => {
  listeClients.forEach((el, key)=>{if(el != ""){
      sslCertificate.get(el).then(function (certificate) {

        let expiringDate = new Date(certificate.valid_to)
        let valid = new Date() < expiringDate
        if(!valid)listeClientNonValides.push(el)
        let invalidSoon = today.setDate(today.getDate()+soon)
        invalidSoon = new Date(invalidSoon) > expiringDate
        if(invalidSoon)listeClientBientotNonValides.push([el, "expire le: "+expiringDate.getDate()+"/"+expiringDate.getMonth()+"/"+expiringDate.getFullYear()])

        console.log(key + "  client: " + el)
        console.log("   Date de début de certificat: " + certificate.valid_from)
        console.log("   Date de fin de certificat: " + certificate.valid_to)
        console.log("   Toujours valide ?: " + valid)
        console.log("   Certificat SSL bientôt invalide (dans "+soon+"jours)?: " + invalidSoon)

        if(++done == listeClients.length-1)
          res(true)
        console.log(["key: "+key, "done: "+done]);
      }).catch((err)=>{
        if(++done == listeClients.length-1)res(true)
        console.log(["key: "+key, "done: "+done]);
      })
  }})
}).then((val)=>{
  console.log("Voici la liste des clients qui s'affichent avec une erreur SSL:");
  console.log(listeClientNonValides);
  console.log("Et Voici la liste des clients avec un certificat SSL bientot expiré (dans "+soon+" jours):");
  console.log(listeClientBientotNonValides);
  console.log("\nSur "+listeClients.length+" clients:\n"+listeClientNonValides.length+" sont invalides,\n"+listeClientBientotNonValides.length+" sont bientôt invalides.");
}).catch((err)=>console.log("erreur"))

function launchHTML(){
  var http = require('http');
  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Hello World!');
    res.end();
  }).listen(8080);
}
