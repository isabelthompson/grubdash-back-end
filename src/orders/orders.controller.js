const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const validStatue = ["pending", "preparing", "out-for-delivery", "delivered"];

const hasData = (dataPropeties) => {
  return (req, res, next) => {
    const values = req.body.data[dataPropeties];
    if (values) return next();
    next({ status: 400, message: `Order must include a ${dataPropeties}` });
  };
};

const hasDeliveTo = hasData("deliverTo");
const hasCellNumber = hasData("mobileNumber");

const isValidStatus = (req, res, next) => {
  const { data = {} } = req.body;
  const status = data.status;
  if (validStatue.includes(status)) return next();
  next({ status: 400, message: `Order must have a status of ${validStatue}` });
};

function hasDishes(req, res, next) {
  const { data = {} } = req.body;
  const dishes = data.dishes;
  if (dishes && Array.isArray(dishes) && dishes.length) return next();
  next({ status: 400, message: "Order must include at least one dish" });
}

const quatityDishes = (req, res, next) => {
  const { data = {} } = req.body;
  const message = data.dishes
    .map((dish, index) =>
      dish.quantity && Number.isInteger(dish.quantity)
        ? null
        : `Dish ${index} mush have a quantity that is an integer greater than 0`
    )
    .filter((errorMsg) => errorMsg !== null)
    .join(",");
  if (message) return next({ status: 400, message });
  next();
};

const routeIdMatch = (req, res, next) => {
  const dishId = req.params.orderId;
  const { id } = req.body.data;
  if (!id || id === dishId) return next();
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${dishId} `,
  });
};

const create = (req, res) => {
  const order = req.body.data;
  order.id = nextId();
  order.status = "pending";
  orders.push(order);
  res.status(201).json({ data: order });
};

const destroy = (req, res) => {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
};

const list = (req, res) => {
  res.json({ data: orders });
};

const read = (req, res) => {
  res.json({ data: res.locals.order });
};

const pendingStatus = (req, res, next) => {
  if (res.locals.order.status === "pending") return next();
  return next({
    status: 400,
    message: "A order cannot be deleted unless it is pending",
  });
};

const orderIdExists = (req, res, next) => {
  const orderId = req.params.orderId;

  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist:  ${orderId}` });
};

const update = (req, res) => {
  const { id } = res.locals.order;
  Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: res.locals.order });
};

module.exports = {
  create: [hasDeliveTo, hasCellNumber, hasDishes, quatityDishes, create],
  delete: [orderIdExists, pendingStatus, destroy],
  list,
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    routeIdMatch,
    isValidStatus,
    hasDeliveTo,
    hasCellNumber,
    hasDishes,
    quatityDishes,
    update,
  ],
};
