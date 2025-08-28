// ==UserScript==
// @name         Remplacement de texte avec cache local
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Remplace des textes sur une page avec un array externe et gestion de version + cache local
// @author       TonNom
// @match        https://genshin.wife4.dev/stats*
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // URL du fichier JSON hébergé
    const jsonFileUrl = 'http://panos.virtreal.fr/sh?id=0f82c8caa&f=Genshin_Anomaly_DB_FR.json';
    let currentVersion = 0;

    // Fonction pour charger le fichier JSON
    function loadReplacements() {

        GM.xmlHttpRequest({
            method: 'GET',
            url: jsonFileUrl,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.version > currentVersion) {
                        // Si la version est plus récente, mettre à jour
                        currentVersion = data.version;
                        const replacements = data.replacements;
                        processText(replacements);
                        // Sauvegarder dans le cache local
                        localStorage.setItem('replacements_cache', JSON.stringify(data));
                        console.log('Nouveaux remplacements chargés et mis en cache');
                    }
                } catch (e) {
                    console.error("Erreur lors du traitement du fichier JSON", e);
                }
            },
            onerror: function() {
                console.error("Erreur de chargement du fichier JSON");
                // En cas d'erreur, on utilise le cache (si disponible)
                if (cachedData) {
                    const cachedJson = JSON.parse(cachedData);
                    processText(cachedJson.replacements);
                    console.log('Utilisation des remplacements en cache (erreur de réseau)');
                }
            }
        });
        // Vérifier si un cache local existe et s'il est valide
        const cachedData = localStorage.getItem('replacements_cache');
        if (cachedData) {
            const cachedJson = JSON.parse(cachedData);
            if (cachedJson.version > currentVersion) {
                currentVersion = cachedJson.version;
                const replacements = cachedJson.replacements;
                processText(replacements);
                console.log('Utilisation des remplacements en cache...');
                return;  // Si cache valide, on termine ici
            }
        }

        // Si pas de cache ou cache invalide, charger depuis le serveur

    }

    // Fonction pour remplacer les textes sur la page
    function processText(replacements) {
        function replaceText(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = node.nodeValue;
                replacements.forEach(([from, to]) => {
                    const regex = new RegExp(from, 'gi');
                    text = text.replace(regex, to);
                });
                node.nodeValue = text;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "SCRIPT" && node.nodeName !== "STYLE") {
                node.childNodes.forEach(replaceText);
            }
        }

        replaceText(document.body);
    }

    // Chargement initial des remplacements
    loadReplacements();
})();
