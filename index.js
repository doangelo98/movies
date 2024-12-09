// Express
const express = require('express');
const app = express();

// MongoDB
const dotenv = require('dotenv').config();

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.ATLAS_URI);
const database = client.db('sample_mflix');
const movies = database.collection('movies');

app.get('/search/title/', async (req, res) => {
  const { title, release_date, genres, languages } = req.query;
  const options = {
    limit: 50,
    sort: { year: -1 },
    projection: {
      _id: 0,
      title: 1,
      year: 1,
      runtime: 1,
      rated: 1,
      languages: 1,
      'imdb.rating': 1,
    },
  };

  try {
    let query = {};

    // Build query based on provided parameters
    if (title) {
      query.title = title;
    }

    if (release_date) {
      const years = release_date.split(',').map(Number);
      if (years.length === 2) {
        query.year = { $gte: years[0], $lte: years[1] };
      } else if (years.length === 1) {
        query.year = { $gte: years[0] };
      }
    }

    if (genres) {
      query.genres = genres;
    }

    if (languages) {
      if (languages === 'en') {
        query.languages = 'English';
      } else if (languages === 'fr') {
        query.languages = 'French';
      }
    }

    if (Object.keys(query).length === 0) {
      return res
        .status(400)
        .send('Bad Request: No valid search parameters provided');
    }

    // Execute the query
    const result = await movies.find(query, options).toArray();

    if (result.length === 0) {
      return res.status(404).send('No results found');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//
app.get('/title/:imdbId', async (req, res) => {
  const { imdbId } = req.params;
  const query = { 'imdb.id': Number(imdbId) };
  const movie = await movies.findOne(query);
  res.status(200).send(movie);
});

app.get('/title/:imdbId/fullcredits', async (req, res) => {
  const { imdbId } = req.params;
  const query = { 'imdb.id': Number(imdbId) };
  const options = { projection: { cast: 1 } };
  const movie = await movies.findOne(query, options);
  res.status(200).send(movie);
});

app.listen(process.env.PORT, () => {
  console.log('Server up and running');
});
