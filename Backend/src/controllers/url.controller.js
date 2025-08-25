const { nanoid } = require('nanoid');
const requestIp = require('request-ip');
const { Log } = require('logging-middleware');

const urlDatabase = new Map();

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

exports.createShortUrl = async (req, res, next) => {
  try {
    const { url, shortcode: customShortcode, validity } = req.body;

    if (!url || !isValidUrl(url)) {
      await Log('backend', 'warn', 'handler', `Invalid URL format received: ${url}`);
      const err = new Error('A valid "url" must be provided.');
      err.statusCode = 400;
      return next(err);
    }

    let shortcode = customShortcode;
    if (shortcode && urlDatabase.has(shortcode)) {
      await Log('backend', 'error', 'db', `Shortcode collision: ${shortcode}`);
      const err = new Error(`Shortcode "${shortcode}" is already in use.`);
      err.statusCode = 409;
      return next(err);
    }

    if (!shortcode) {
      do {
        shortcode = nanoid(7);
      } while (urlDatabase.has(shortcode));
    }

    const validityInMinutes = validity || 30;
    const expiresAt = new Date(Date.now() + validityInMinutes * 60 * 1000);

    const record = {
      longUrl: url,
      createdAt: new Date(),
      expiresAt,
      clickDetails: [],
    };
    urlDatabase.set(shortcode, record);

    await Log('backend', 'info', 'service', `Created shortcode ${shortcode} for ${url}`);

    res.status(201).json({
      shortLink: `${process.env.BASE_URL}/${shortcode}`,
      expiry: expiresAt.toISOString(),
    });
  } catch (error) {
    await Log('backend', 'fatal', 'controller', `Error in createShortUrl: ${error.message}`);
    next(error);
  }
};

exports.redirectUrl = async (req, res, next) => {
  try {
    const { shortcode } = req.params;
    const record = urlDatabase.get(shortcode);

    if (!record) {
      await Log('backend', 'error', 'controller', `Non-existent shortcode: ${shortcode}`);
      const err = new Error('Shortcode not found.');
      err.statusCode = 404;
      return next(err);
    }

    if (record.expiresAt < new Date()) {
      urlDatabase.delete(shortcode);
      await Log('backend', 'warn', 'controller', `Expired shortcode accessed: ${shortcode}`);
      const err = new Error('This link has expired.');
      err.statusCode = 410;
      return next(err);
    }

    record.clickDetails.push({
      timestamp: new Date().toISOString(),
      sourceReferrer: req.headers.referer || 'Direct access',
      ipAddress: requestIp.getClientIp(req),
    });

    await Log('backend', 'info', 'route', `Redirecting shortcode ${shortcode}`);
    res.redirect(302, record.longUrl);
  } catch (error) {
    await Log('backend', 'fatal', 'controller', `Error in redirectUrl: ${error.message}`);
    next(error);
  }
};

exports.getShortUrlStats = async (req, res, next) => {
  try {
    const { shortcode } = req.params;
    const record = urlDatabase.get(shortcode);

    if (!record) {
      await Log('backend', 'warn', 'controller', `Stats for non-existent shortcode: ${shortcode}`);
      const err = new Error('Shortcode not found.');
      err.statusCode = 404;
      return next(err);
    }

    await Log('backend', 'debug', 'controller', `Stats retrieved for shortcode: ${shortcode}`);
    res.status(200).json({
      totalClicks: record.clickDetails.length,
      originalUrl: record.longUrl,
      creationDate: record.createdAt.toISOString(),
      expiryDate: record.expiresAt.toISOString(),
      detailedClicks: record.clickDetails,
    });
  } catch (error) {
    await Log('backend', 'fatal', 'controller', `Error in getShortUrlStats: ${error.message}`);
    next(error);
  }
};