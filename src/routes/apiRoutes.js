const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// REST API Endpoints
router.get('/health', (req, res) => weatherController.getHealth(req, res));
router.get('/cities', (req, res) => weatherController.getCities(req, res));
router.get('/cities/search', (req, res) => weatherController.searchCities(req, res));
router.get('/history', (req, res) => weatherController.getHistory(req, res));
router.delete('/history/all', (req, res) => weatherController.clearAllHistory(req, res));
router.delete('/history/:cityKey', (req, res) => weatherController.deleteHistoryItem(req, res));
router.get('/weather', (req, res) => weatherController.getWeather(req, res));
router.get('/weather/compare', (req, res) => weatherController.compareWeather(req, res));

module.exports = router;
