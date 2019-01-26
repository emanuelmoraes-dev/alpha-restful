const { Entity } = require('../../app')
const restful = require('./restful')

restful.add(new Entity({
    name: 'House',
    resource: 'houses',
    descriptor: {
        info: {
            peoples: [{ id: String }]
        }
    },
    sync: {
        info: {
            fill: true,
            sync: {
                peoples: { name: 'People', fill: true }
            }
        }
    }
}))

restful.add(new Entity({
    name: 'People',
    resource: 'peoples',
    descriptor: {
        name: String
    },
    sync: {
        house: {
            name: 'House',
            fill: true,
            ignoreFillProperties: 'peoples',
            syncronized: ['info.peoples']
        }
    }
}))