// interface FinalizationRegistry<T> {
//     readonly [Symbol.toStringTag]: "FinalizationRegistry";
//
//     /**
//      * Registers a value with the registry.
//      * In es2023 the value can be either a symbol or an object, in previous versions only object is permissible.
//      * @param target The target value to register.
//      * @param heldValue The value to pass to the finalizer for this value. This cannot be the
//      * target value.
//      * @param unregisterToken The token to pass to the unregister method to unregister the target
//      * value. If not provided, the target cannot be unregistered.
//      */
//     register(target: WeakKey, heldValue: T, unregisterToken?: WeakKey): void;
//
//     /**
//      * Unregisters a value from the registry.
//      * In es2023 the value can be either a symbol or an object, in previous versions only object is permissible.
//      * @param unregisterToken The token that was used as the unregisterToken argument when calling
//      * register to register the target value.
//      */
//     unregister(unregisterToken: WeakKey): void;
// }
//
// interface FinalizationRegistryConstructor {
//     readonly prototype: FinalizationRegistry<any>;
//
//     /**
//      * Creates a finalization registry with an associated cleanup callback
//      * @param cleanupCallback The callback to call after a value in the registry has been reclaimed.
//      */
//     new<T>(cleanupCallback: (heldValue: T) => void): FinalizationRegistry<T>;
// }
//
// declare var FinalizationRegistry: FinalizationRegistryConstructor;

class FinalizationRegistryMock<T> implements FinalizationRegistry<T> {
    readonly [Symbol.toStringTag] = "FinalizationRegistry";

    register(target: WeakKey, heldValue: T, unregisterToken?: WeakKey): void {
        // empty
    }

    unregister(unregisterToken: WeakKey): void {
        // empty
    }

    constructor(cleanupCallback: (heldValue: T) => void) {
        // empty
        console.log('Mock FinalizationRegistry. you are running in compatibility mode.');
        console.warn('Mock FinalizationRegistry. you are running in compatibility mode.');
        console.error('Mock FinalizationRegistry. you are running in compatibility mode.');
    }
}

