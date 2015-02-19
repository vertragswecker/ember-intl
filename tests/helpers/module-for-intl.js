import Ember from 'ember';
import IntlService from '../../services/intl';
import { runDestroy } from '../helpers/run-append';

export default function (name, callbacks) {
    callbacks = callbacks || {};

    QUnit.module(name, {
        createService: function (container, serviceContext) {
            serviceContext = serviceContext || {};

            var service;

            if (!container.has('intl:main')) {
                service = IntlService.create(Ember.$.extend({}, {
                    container:     this.container,
                    locales:       ['en'],
                    defaultLocale: 'en'
                }, serviceContext));

                container.register('intl:main', service, {
                    singleton:   true,
                    instantiate: false
                });
            } else {
                service = container.lookup('intl:main');

                Ember.run(function () {
                    service.setProperties(serviceContext);
                });
            }
            
            return service;
        },

        setup: function () {
            var self = this;

            Ember.lookup = this.lookup = { Ember: Ember };

            var container = this.container = new Ember.Container();
            var service   = this.service = this.createService(container);
            
            this.intlBlock = function (templateString, serviceContext, viewContext) {
                if (typeof serviceContext === 'object') {
                    Ember.run(function () {
                        service.setProperties(serviceContext);
                    });
                }

                container.injection('formatter', 'intl', 'intl:main');

                // mock the component lookup service since it's invoked prior to
                // looking up a handlebar helper to determine if the helper
                // is a valid component.
                container.register('component-lookup:main', Ember.Object.extend({
                    lookupFactory: function () { return false; }
                }));

                return Ember.View.create({
                    intl:      service,
                    container: container,
                    template:  Ember.HTMLBars.compile(templateString),
                    context:   viewContext || {}
                });
            };

            if (callbacks.setup) {
                callbacks.setup(container);
            }
        },
        teardown: function () {
            runDestroy(this.container);

            if (callbacks.teardown) {
                callbacks.teardown(this.container);
            }
        }
    });
}
