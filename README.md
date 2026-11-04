# Jeu de plateforme multijoueur avec Phaser

Un jeu de plateforme en 2 niveaux, jouable à plusieurs, réalisé avec Phaser, Node.js, Express et Socket.IO.

## But du jeu

- Ramasse toutes les étoiles pour gagner des points.
- Évite les bombes : si tu en touches une, la partie est terminée.
- Une fois toutes les étoiles ramassées, une porte apparaît : atteins-la pour finir le niveau.

Les autres joueurs connectés apparaissent en rouge.

## Commandes

| Touche | Action |
|---|---|
| ← / → | Se déplacer |
| ↑ | Sauter |

## Lancer le jeu

Il faut avoir [Node.js](https://nodejs.org) installé.

```
git clone https://github.com/staukolo/phaser-multijoueur-ondine.git
cd phaser-multijoueur-ondine
npm install
node index.js
```

Ouvre ensuite http://localhost:3000 dans ton navigateur. Pour tester le multijoueur, ouvre un deuxième onglet à la même adresse.

