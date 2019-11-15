const chalk = require('chalk');
const TaskDb = require('../models/task.server.models');
const version = '1.0';

const __TASK_RUNNER_INSTANCE__ = Symbol.for(
  '__task_runner_instance_' + version + '__'
);
const _status = Symbol('status');
const _taskMemoryList = Symbol('taskMemoryList');
const _check = Symbol('check');
const _addTask = Symbol('addTask');
const _deleteTaskFromMemory = Symbol('deleteTaskFromMemory');
const _onErrorBuild = Symbol('onErrorBuild');
const _onStepBuild = Symbol('onStepBuild');
const _onDoneBuild = Symbol('onDoneBuild');

const PENDING = 'pending';
const REJECTED = 'rejected';
const DONE = 'done';

class TaskCore {
  constructor() {
    this[_taskMemoryList] = {};
  }

  // PUBLIC.

  register(params, response, accept) {
    // Task registering need a callback.
    if (typeof accept !== 'function') {
      throw new Error(`Task onAccept callback must be a function.`);
    }
    // Task need a name.
    if (!params.key || typeof params.key !== 'string') {
      throw new Error(`Task key required, and must be a string.`);
    }

    this[_addTask](params, response, accept);
  }

  get() {
    const list = this[_taskMemoryList];
    return Object.keys(list).map(id => list[id].display());
  }

  getById(id) {
    return this[_taskMemoryList][id] ? this[_taskMemoryList][id].display() : null;
  }

  getByKey(key) {
    return this.get().filter(t => t.key === key);
  }

  delete(task) {
    this[_deleteTaskFromMemory](task);
  }

  // PRIVATE METHODS.

  [_check](key) {
    // Find pending task with same name
    const list = this[_taskMemoryList];
    const id = Object.keys(list).find(
      id => list[id].key === key && list[id][_status] === PENDING
    );
    return id && list[id].unique ? id : null;
  }

  [_addTask]({ key, unique }, response, accept) {
    // If task is already in list, is unique, and is pending.
    // Call callback and stop process.
    const _id = this[_check](key);
    if (_id) {
      return response(this[_taskMemoryList][_id].display());
    }
    // Create and add task to list.
    const id = getID();
    const task = new Task(key, id, unique);
    this[_taskMemoryList][id] = task;

    accept(
      this[_onErrorBuild](task),
      this[_onStepBuild](task),
      this[_onDoneBuild](task)
    );

    return response(task.display());
  }

  [_deleteTaskFromMemory](task) {
    delete this[_taskMemoryList][task.memId];
    log(`key ${task.key}, id ${task.memId} deleted from memory at ${Date.now()}`);
  }

  // Error handler builder.
  [_onErrorBuild](task) {
    return body => {
      task.write(body);
      task.reject();
      task.save();
      this[_deleteTaskFromMemory](task);
    };
  }

  // Step handler builder.
  [_onStepBuild](task) {
    return body => {
      task.write(body);
    };
  }

  // End success handler builder.
  [_onDoneBuild](task) {
    return body => {
      task.write(body);
      task.done();
      task.save();
      this[_deleteTaskFromMemory](task);
    };
  }
}

class Task {
  constructor(key, id, unique = true) {
    const d = Date.now();
    const message = `key ${key}, id ${id}, task started at ${d}`;
    this[_status] = PENDING;
    this.memId = id;
    this.key = key;
    this.unique = unique;
    this.created = d;
    this.ended = null;
    this.body = `Task ${key} started at ${d} with id ${id}`;
    log(message);
  }

  reject() {
    this[_status] = REJECTED;
    this.ended = Date.now();
    warn(`key ${this.key}, memId ${this.id} rejected at ${this.ended}`);
  }

  done() {
    this[_status] = DONE;
    this.ended = Date.now();
    log(`key ${this.key}, memId ${this.id} successful finished at ${this.ended}`);
  }

  write(message) {
    this.body = message;
  }

  display() {
    return this.clone();
  }

  clone() {
    const clone = Object.assign({}, this);
    clone.status = this[_status];
    delete clone[_status];
    return clone;
  }

  save() {
    const task = this.clone();
    TaskDb.create(task, err => {
      if (err)
        return danger(
          `Unable to save key ${task.key}, memId ${task.memId} in database.`,
          err
        );
      log(`key ${task.key}, memId ${task.memId}, task saved in database.`);
    });
  }
}

// HELPERS
function log(message) {
  console.log(chalk.green(`Task runner : ${message}`));
}

function warn(message) {
  console.log(chalk.yellow(`Task runner Warning : ${message}`));
}

function danger(message) {
  console.log(chalk.red(`Task runner Error : ${message}`));
}

const getID = function() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return (
    '_' +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
};

// Create task runner instance.
// Singleton will be stored in global object.
// Check if instance already created and stored in namespace.
const globalSymbols = Object.getOwnPropertySymbols(global);
const warnExist = globalSymbols.indexOf(__TASK_RUNNER_INSTANCE__) > -1;

if (!warnExist) {
  global[__TASK_RUNNER_INSTANCE__] = new TaskCore();
  log(`Task runner instance created at ${Date.now()}`);
}

// export the task runner instance.
module.exports = global[__TASK_RUNNER_INSTANCE__];
