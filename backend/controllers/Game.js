const VideoGames = require('../models/Game');
const FavoritedGames = require('../models/FavoritedGames');
const { default: axios } = require('axios');
const ObjectId = require('mongodb').ObjectId;

const CLIENT_ID = process.env.REACT_APP_IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_IGDB_CLIENT_SECRET;
const ACCESS_TOKEN = process.env.REACT_APP_IGDB_ACCESS_TOKEN;

async function get10Games(req, res) {
  const { userId } = req.body;
  try {
    //retrive data from the api via a POST request
    const VideoGames = await axios({
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      //data is the type of info we want from the database
      data: 'fields id,name, platforms.name, release_dates.date, summary, artworks.url; limit 30;',
    });

    //promises which map through the array created Videogames variable creating a new array
    const artUrl = VideoGames.data.map((game) => {
      //check if artwork exists and if not then return empty
      if (game.artworks && game.artworks.length > 0) {
        //array buffer is used to turn the data to Base64
        return game.artworks[0].url;
      }
      return null;
    });

    let favoritedGames = [];
    if (userId) {
      favoritedGames = await FavoritedGames.find({
        userId: new ObjectId(userId),
      });
      console.log('favoritedGames', favoritedGames);
    }

    const gamesWithImages = VideoGames.data.map((game, index) => {
      let isFavoritedGame = false;
      if (favoritedGames.length > 0) {
        isFavoritedGame = favoritedGames.some((fg) => {
          console.log('asd', fg.externalGameId, game.id);
          return fg.externalGameId == game.id.toString();
        });
      }

      return {
        ...game,
        image: artUrl[index],
        favorited: isFavoritedGame,
      };
    });

    res.json(gamesWithImages);
  } catch (error) {
    console.log('error getting POST request', error);
    res.status(500).json({ message: 'error getting POST request' });
  }
}
/*
        map data from videogames to create new requests

        if you return a promise in the map function, you will have an array of promises

        research Promise.all() to see how you can use this to respond to the front end once you have the images for all your games

        */

async function SearchResults(req, res) {
  //note : in req.body.name , name is the data object we want to retrive
  const searchString = req.body.name;
  try {
    const VideoGames = await axios({
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      data: `search "${searchString}"; fields name, cover.url, genres.name, platforms.name, summary; where version_parent = null; limit 10;`,
    });
    if (VideoGames.data.length === 0) {
      return res.status(404).json({ message: 'no matching games found' });
    }
    res.json(VideoGames.data);
  } catch (error) {
    console.error('Error searching for games by name', error);
    res.status(500).json({ message: 'Error searching for games' });
  }
}

async function get1Games(req, res) {
  const gameName = req.body.gameName;
  try {
    const VideoGames = await axios({
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      data: `fields name, platforms.name, release_dates.date, summary; where id == ${gameName}; limit 1;`,
    });
    /*
        map data from videogames to create new requests
  
        if you return a promise in the map function, you will have an array of promises
  
        research Promise.all() to see how you can use this to respond to the front end once you have the images for all your games.
        */
    res.json(VideoGames.data);
  } catch (error) {
    console.log('error getting POST request', error);
    res.status(500).json({ message: `error getting POST request` });
  }
}


async function favoriteGame(req, res) {
  console.log('favorite called', req.body);

  const { name, externalGameId, userId, description } = req.body;
  console.log('description', description);

  const game = new VideoGames({
    VideoGames_name: name,
    externalGameId,
    VideoGames_description: description,
  });

  try {
    let existingGame = await VideoGames.findOne({
      externalGameId: externalGameId,
    });

    if (!existingGame) {
      existingGame = await game.save();
    }
    
    const favoritedGame = new FavoritedGames({
      gameId: existingGame._id,
      externalGameId,
      userId: new ObjectId(userId),
    });

    await favoritedGame.save();

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

module.exports = {
  get10Games,
  SearchResults,
  get1Games,
  favoriteGame,
};
