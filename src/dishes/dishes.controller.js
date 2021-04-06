const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
const isValidDish = (dataPropeties) => {
  return (req, res, next) => {
    const { data = {} } = req.body;
    const values = data[dataPropeties];
    if (values) {
      return next();
    }
    next({ status: 400, message: `Dish must have a ${dataPropeties}` });
  };
};

const hasName = isValidDish("name");
const hasDescription = isValidDish("description");
const hasImageUrl = isValidDish("image_url");

const hasPrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) return next();
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
};

const routeIdMatch = (req, res, next) => {
  const dishId = req.params.dishId;
  const { id } = req.body.data;
  if (!id || id === dishId) return next();
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId} `,
  });
};

const create = (req, res) => {
  const dish = req.body.data;
  dish.id = nextId();

  dishes.push(dish);
  res.status(201).json({ data: dish });
};

const destroy = (req, res) => {
  const index = dishes.findIndex((dish) => dish.id === res.locals.dish);
  dishes.splice(index, 1);
  res.sendStatus(204);
};

const dishIdExists = (req, res, next) => {
  const dishId = req.params.dishId;

  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}` });
};

const list = (req, res, next) => {
  res.json({ data: dishes });
};

const read = (req, res) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res) => {
  const { id } = res.locals.dish;
  Object.assign(res.locals.dish, req.body.data, { id });
  res.json({ data: res.locals.dish });
};

module.exports = {
  create: [hasName, hasDescription, hasPrice, hasImageUrl, create],
  delete: [dishIdExists, destroy],
  list,
  read: [dishIdExists, read],
  update: [
    dishIdExists,
    routeIdMatch,
    hasName,
    hasDescription,
    hasPrice,
    hasImageUrl,
    update,
  ],
};
