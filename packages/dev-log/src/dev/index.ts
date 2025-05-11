import { dog } from './../selfDog';
import { createConstructor, getRandomInt } from 'a-js-tools';
import {
  DevCallBack,
  DevContextHookFn,
  DevTool,
  InitDevOption,
  OriginDevTool,
} from './types';
import {
  isAsyncFunction,
  isEmptyArray,
  isFunction,
  isGeneratorFunction,
  isType,
  isUndefined,
} from 'a-type-of-js';
import {
  bluePen,
  brightRedPen,
  colorText,
  hexPen,
  magentaPen,
  numberPen,
  redPen,
  yellowPen,
} from 'color-pen';

/**
 *
 * 在真实使用中，无论有没有使用 it ， 回调函数的 level 都是 1，message 是下一级的而不是上一级的
 *
 */
/**
 *
 * 创建 dev 的工厂函数
 *
 */
function Dev(this: OriginDevTool, options: InitDevOption): OriginDevTool {
  /**  是否跳过  */
  const _skip = options?.skip ?? false;
  /**  当前的层级  */
  const _level = options.level;
  /**  当前层级的随机色（除了 _lever 为 0 时都继承于父级）  */
  const _randomColor = [...options.randomColor];
  /**  当前执行名称  */
  const _name = options.name;
  /**  执行列表的描述  */
  const _description: string[] = [...(options.description || [''])];
  /**  执行栈  */
  const _executionStack = options.executionStack;
  /**  当前的执行状态，仅当上一步骤执行完毕时才允许下一步骤开始执行  */
  const runList: {
    /**  唯一 id  */
    id: symbol;
    /**  状态  */
    running: boolean;
    /**  执行描述  */
    description: string;
  }[] = [];

  dog('当前执行名称为：', _name);
  dog('当前执行的等级为：', _level);

  dog('当前执行的色值列表为：', [..._randomColor]);
  /**
   *  自身执行要之行的 before
   */
  const hooks: {
    before: (DevContextHookFn | undefined)[];
    after: (DevContextHookFn | undefined)[];
  } = {
    before: [],
    after: [],
  };

  /** 函数对象的主体  */
  const _dev = async <T extends void = void>(
    message: string,
    suite: DevCallBack<T>,
  ) => {
    /**  当前（要）执行的块  */
    const lastExecution = _executionStack[0];

    if (isUndefined(lastExecution)) {
      _executionStack.push({ message, callback: suite });
    } else {
      /**  当前（要）执行的块不是我  */
      const isNotMe =
        lastExecution.message !== message && lastExecution.callback !== suite;

      // 执行的非自身则显示将自身推入执行栈
      if (isNotMe) {
        _executionStack.push({ message, callback: suite });
        return;
      }
    }
    const id = Symbol(message);
    const lastRun = runList[runList.length - 1];
    const currentRun = {
      id,
      running: true,
      description: message,
    };
    {
      /**  当前执行的色值设置  */
      const currentColor = getRandomInt(1, 222);

      /**  色值  */
      if (_level === _randomColor.length) {
        _randomColor.push(currentColor);
      } else {
        _randomColor.splice(_level, 1, currentColor);
      }
    }

    /**  前导符  */
    const startsStr = _randomColor.reduce(
      (previousValue: string, currentValue: number) =>
        previousValue.concat(numberPen(currentValue)`⎆ `),
      '',
    );
    /**  兼容打印  */
    const printf = (message: string) =>
      console.log(startsStr, ...colorText(message));

    dog('上一步执行', { ...lastRun });
    dog('当前执行', { ...currentRun });
    dog('父级给出的执行状态', { ...options.running });
    if (options.running.running === false) {
      const parentMessage = redPen(options.running.description);
      const awaitRun = yellowPen(lastRun.description);
      printf(
        `当前 "${bluePen(message)}" 步骤
        \r其父级 "${parentMessage}" 已执行完毕
        \r上一个步骤执行却未执行完毕 "${awaitRun}"
        \r现在期待 
        \r"${parentMessage}-${awaitRun}" 
        \r异步方法前有 await 等待
        `,
      );

      printf('\n\n\n\n\n看上面 👆\n\n\n\n');
    }

    if (lastRun && lastRun.running) {
      const awaitRun = brightRedPen(lastRun.description);
      printf(
        `当前 ${bluePen(message)} 期待上一个步骤执行完毕 ${awaitRun}（可添加 await 等待 ${awaitRun}）`,
      );
      printf('\n\n\n\n\n看上面 👆\n\n\n\n\n');
    }

    runList.push(currentRun);

    /**  跳过执行  */
    if (_skip) {
      printf(`${yellowPen`跳过执行`} ${message}`);
      currentRun.running = false;
      return;
    }

    /// 执行自身的 forEach
    try {
      {
        /// 执行顺序的特殊性导致执行钩子函数禁止🈲被封装
        for (const fn of hooks.before) {
          try {
            if (!fn) continue;
            if (isAsyncFunction(fn)) {
              await Reflect.apply(fn, this, [this]);
            } else if (isFunction(fn) || isGeneratorFunction(fn)) {
              Reflect.apply(fn, this, [this]);
            }
          } catch (error) {
            console.error('Hook执行出错:', error);
          }
        }
      }
    } catch (error) {
      dog.error('执行自身的  beforeEach 报错', error);
      console.log(error);
    }

    /**
     *
     *   创建的子参数列表
     *
     *
     *
     *  <span style="color:#ff0;">其实在使用的时候 </span>
     *
     *
     */
    const childOption: InitDevOption = {
      skip: false,
      before: [],
      after: [],
      level: _level + 1,
      randomColor: [..._randomColor],
      running: currentRun,
      executionStack: [],
      ...(_level === 0
        ? {
            name: message,
            description: [],
          }
        : {
            name: _name,
            description: [..._description, message],
          }),
    };

    printf(hexPen('#166')`执行 ${message}`);

    const newThis = new DevConstructor(childOption) as unknown as DevTool;
    // 执行由子测试的 beforeEach 绑定的 hook
    try {
      {
        /// 执行顺序的特殊性导致执行钩子函数禁止🈲被封装
        for (const fn of childOption.before) {
          try {
            if (!fn) continue;
            if (isAsyncFunction(fn)) {
              await Reflect.apply(fn, newThis, [newThis]);
            } else if (isFunction(fn) || isGeneratorFunction(fn)) {
              Reflect.apply(fn, newThis, [newThis]);
            }
          } catch (error) {
            console.error('Hook执行出错:', error);
          }
        }
      }
    } catch (error) {
      dog.error('执行子测试的 beforeEach 出错', error);
    }

    // 执行测试主体
    if (isType<Promise<T>>(suite, isAsyncFunction(suite))) {
      try {
        await suite(newThis);
      } catch (error) {
        dog.error(error);
        printf(magentaPen(`执行本体方法出现异常 \n ${error}`));
      }
    } else if (isFunction(suite) || isGeneratorFunction(suite)) {
      suite(newThis);
    }

    /// 执行顺序的特殊性导致执行钩子函数禁止🈲被封装
    for (const fn of childOption.after.reverse()) {
      try {
        if (!fn) continue;
        if (isAsyncFunction(fn)) {
          await Reflect.apply(fn, newThis, [newThis]);
        } else if (isFunction(fn) || isGeneratorFunction(fn)) {
          Reflect.apply(fn, newThis, [newThis]);
        }
      } catch (error) {
        console.error('Hook执行出错:', error);
      }
    }
    /// 执行顺序的特殊性导致执行钩子函数禁止🈲被封装
    for (const fn of hooks.after.reverse()) {
      try {
        if (!fn) continue;
        if (isAsyncFunction(fn)) {
          await Reflect.apply(fn, this, [this]);
        } else if (isFunction(fn) || isGeneratorFunction(fn)) {
          Reflect.apply(fn, this, [this]);
        }
      } catch (error) {
        console.error('Hook执行出错:', error);
      }
    }
    _executionStack.shift(); // 弹出当前执行
    currentRun.running = false;
    if (!isEmptyArray(_executionStack)) {
      /**  当前执行的栈  */
      const currentExecution = _executionStack[0];
      if (isAsyncFunction(currentExecution.callback)) {
        await _dev(currentExecution.message, currentExecution.callback);
      } else {
        _dev(currentExecution.message, currentExecution.callback);
      }
    }
  };

  Object.setPrototypeOf(_dev, this);

  const devParamList = [
    [
      'skip',
      () =>
        new DevConstructor({
          /**  为了方便之后的扩展，使用参数进行处理数据  */
          before: [],
          after: [],
          level: _level,
          randomColor: [..._randomColor],
          skip: true,
          name: _name,
          description: [..._description],
          running: options.running,
          executionStack: [],
        }),
    ],
    ['name', () => _name],
    ['beforeEach', () => (fn?: DevContextHookFn) => hooks.before.push(fn)],
    ['afterEach', () => (fn?: DevContextHookFn) => hooks.after.push(fn)],
  ];

  if (_level > 0) {
    devParamList.push(
      ...[
        ['before', () => (fn?: DevContextHookFn) => options.before.push(fn)],
        ['after', () => (fn?: DevContextHookFn) => options.after.push(fn)],
        ['description', () => _description[_description.length - 1]],
      ],
    );
  }

  /**  属性列表组  */
  const properties = Object.fromEntries(
    devParamList.map(e => [e[0], { get: e[1] }]),
  );

  /**  通过  defineProperties 给函数对象设置属性  */
  Object.defineProperties(_dev, properties);

  return _dev as unknown as DevTool;
}
/**
 *
 * 装配 dev
 *
 */
const DevConstructor = createConstructor(Dev);

export { DevConstructor as Dev };
