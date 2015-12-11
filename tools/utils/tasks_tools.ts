import * as gulp from 'gulp';
import * as util from 'gulp-util';
import * as chalk from 'chalk';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import {readdirSync, existsSync, lstatSync} from 'fs';
import {join} from 'path';
import {TOOLS_DIR} from '../config';
import {TaskCache} from './task_utils/task_cache';

const TASKS_PATH = join(TOOLS_DIR, 'tasks');

export function loadTasks(): void {
  scanDir(TASKS_PATH, (taskname) => registerTask(taskname));
}

let tasksCache: TaskCache = new TaskCache();

export function task(taskname: string, option?: string) {
  if (!tasksCache.hasTask(taskname, option)) {
    util.log('Loading task', chalk.yellow(taskname, option));
    tasksCache.setTask(taskname, option, require(join('..', 'tasks', taskname))(gulp, gulpLoadPlugins(), option));
  }
  return tasksCache.getTask(taskname, option);
}

// ----------
// Private.

function registerTask(taskname: string, filename?: string, option: string = ''): void {
  gulp.task(taskname, function () {
    return task(filename || taskname, option).apply(null, arguments);
  });
}

// TODO: add recursive lookup ? or enforce pattern file + folder (ie ./tools/utils & ./tools/utils.ts )
function scanDir(root: string, cb: (taskname: string) => void) {
  if (!existsSync(root)) return;

  walk(root);

  function walk(path) {
    let files = readdirSync(path);
    for (let i = 0; i < files.length; i += 1) {
      let file = files[i];
      let curPath = join(path, file);
      if (lstatSync(curPath).isDirectory()) { // recurse
        path = file;
        walk(curPath);
      }
      if (lstatSync(curPath).isFile() && /\.ts$/.test(file)) {
        let taskname = file.replace(/(\.ts)/, '');
        cb(taskname);
      }
    }
  }
}
