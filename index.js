'use strict';

var update = require('react/addons').addons.update;
var utils = require('./utils.js');

/**
 * Creates the mixin, ready for use in a store
 *
 * @param Reflux object An instance of Reflux
 * @returns {{setState: Function, init: Function}}
 */
module.exports = function stateMixin(Reflux) {

    if (typeof Reflux !== 'object' || typeof Reflux.createAction !== 'function') {
        throw new Error('Must pass reflux instance to reflux-state-mixin');
    }

    function attachAction(options, actionName) {
        if (this[actionName]) {
            console.warn(
                'Not attaching event ' + actionName + '; key already exists'
            );
            return;
        }
        this[actionName] = Reflux.createAction(options);
    }

    return {
        setState: function (newState) {
            var changed = false;
            var prevState = update({}, {$merge: this.state});
            var statesToTrigger = [];
            for (var key in newState) {
                if (newState.hasOwnProperty(key)) {
                    if (this.state[key] !== newState[key]) {
                        this.state[key] = newState[key];
                        statesToTrigger.push(key);
                        //this[key].trigger(state[key]);
                        changed = true;
                    }
                }
            }

            if (changed) {
                if(utils.isFunction(this.shouldStoreUpdate)) {
                    if(this.shouldStoreUpdate(prevState) === false){
                        return;
                    }
                }

                for(var index in statesToTrigger){
                    key = statesToTrigger[index];
                    this[key].trigger(newState[key]);
                }

                this.trigger(this.state);

                if (utils.isFunction(this.storeDidUpdate)) {
                    this.storeDidUpdate(prevState);
                }
            }

        },

        init: function () {
            if (utils.isFunction(this.getInitialState)) {
                this.state = this.getInitialState();
                for (var key in this.state) {
                    if (this.state.hasOwnProperty(key)) {
                        attachAction.call(this, this.state[key], key);
                    }
                }
            }
        },

        connect: function (store, key) {
            return {
                getInitialState: function () {
                    if (!utils.isFunction(store.getInitialState)) {
                        return {};
                    } else if (key === undefined) {
                        return store.state;
                    } else {
                        return utils.object([key], [store.state[key]]);
                    }
                },
                componentDidMount: function () {
                    utils.extend(this, Reflux.ListenerMethods);
                    var noKey = key === undefined;
                    var me = this,
                        cb = (noKey ? this.setState : function (v) {
                            if (typeof me.isMounted === "undefined" || me.isMounted() === true) {
                                me.setState(utils.object([key], [v]));
                            }
                        }),
                        listener = noKey ? store : store[key];
                    this.listenTo(listener, cb);
                },
                componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
            }
        }
    }
};








