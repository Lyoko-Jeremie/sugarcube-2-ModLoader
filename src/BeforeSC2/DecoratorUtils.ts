// TS 5 new style decorators
// see : https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators
//      https://wangdoc.com/typescript/decorator

export function sealed<Class extends abstract new (...args: any) => any>(
    target: Class,
    context: ClassDecoratorContext<Class>
) {
    Object.seal(target);
    Object.seal(target.prototype);
}

export namespace ClassDecoratorUtil {

    export interface InfoTypeItemConfig {
        writable: false,
        configurable: false,
        enumerable: true,
    }

    export interface InfoTypeItem {
        info: ClassMemberDecoratorContext;
        config: InfoTypeItemConfig;
    }

    export interface ClassInfo {
        seal?: boolean,
    }

    export type InfoType = Map<string | symbol, InfoTypeItem>;

    export class InfoData {
        configInfo: InfoType = new Map<string | symbol, InfoTypeItem>();
        classInfo: ClassInfo = {};
    }

    export type ThisClassType = { [key: (string | symbol)]: any, "ClassDecoratorUtil_InfoData": InfoData };

    export function finishClassDecorate(config: ClassInfo) {
        return function <Class extends abstract new (...args: any) => any>(
            target: Class,
            context: ClassDecoratorContext<Class>
        ) {
            context.addInitializer(function (this: Class) {
                if (config.seal) {
                    Object.seal(target);
                    Object.seal(target.prototype);
                }
            });

            if (!target.prototype.ClassDecoratorUtil_InfoData) {
                target.prototype.ClassDecoratorUtil_InfoData = new InfoData();
            }
            target.prototype.ClassDecoratorUtil_InfoData.classInfo = config;

            for (const [name, item] of target.prototype.ClassDecoratorUtil_InfoData.configInfo) {
                target.prototype = Object.defineProperty(target.prototype, name, {
                    value: target.prototype[name],
                    writable: item.config.writable,
                    configurable: item.config.configurable,
                    enumerable: item.config.enumerable,
                });
            }

            return target;
        }
    }

    // export function sealedClass<Class extends abstract new (...args: any) => any>(
    //     target: Class,
    //     context: ClassDecoratorContext<Class>
    // ) {
    //     Object.seal(target);
    //     Object.seal(target.prototype);
    // }

    export function configField(config: InfoTypeItemConfig) {
        return function <ThisClass extends ThisClassType>(
            value: undefined,
            context: ClassFieldDecoratorContext<ThisClass>
        ) {
            return function <VType>(this: ThisClass, initialValue: VType) {
                if (!this.ClassDecoratorUtil_InfoData) {
                    this.ClassDecoratorUtil_InfoData = new InfoData();
                }
                this.ClassDecoratorUtil_InfoData.configInfo.set(context.name, {
                    info: context,
                    config: config,
                });
                return initialValue;
            }
        }
    }

    export function configMethod(config: InfoTypeItemConfig) {
        return function <ThisClass extends ThisClassType, F extends (this: ThisClass, ...args: any) => any>(
            value: F,
            context: ClassMethodDecoratorContext<ThisClass, F>
        ) {
            return function <VType>(this: ThisClass, initialValue: VType) {
                if (!this.ClassDecoratorUtil_InfoData) {
                    this.ClassDecoratorUtil_InfoData = new InfoData();
                }
                this.ClassDecoratorUtil_InfoData.configInfo.set(context.name, {
                    info: context as any,
                    config: config,
                });
                return initialValue;
            }
        }
    }

}

export function sealedField<This>(
    value: undefined,
    context: ClassFieldDecoratorContext<This>
) {
    return function <VType>(this: This, initialValue: VType) {
        Object.defineProperty(this, context.name, {
            value: initialValue,
            writable: false,
            configurable: false,
            enumerable: true,
        });
    }
}

// export function sealed<Class extends abstract new (...args: any) => any>(
//     target: Class,
//     context: ClassDecoratorContext<Class>
// ) {
//     Object.seal(target);
//     Object.seal(target.prototype);
// }

export function sealedField2<VType>(initialValue: VType) {
    return function <This>(
        value: undefined,
        context: ClassFieldDecoratorContext<This>
    ) {
        return function (this: This) {
            Object.defineProperty(this, context.name, {
                value: initialValue,
                writable: false,
                configurable: false,
                enumerable: true,
            });
        }
    }
}

export function sealedMethod() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.writable = false;
        descriptor.configurable = false;
    };
}

export function enumerable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = value;
    };
}

export function configurable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = value;
    };
}

export function loggedMethod<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
    const methodName = String(context.name);

    function replacementMethod(this: This, ...args: Args): Return {
        console.log(`LOG: Entering method '${methodName}'.`)
        const result = target.call(this, ...args);
        console.log(`LOG: Exiting method '${methodName}'.`)
        return result;
    }

    return replacementMethod;
}
