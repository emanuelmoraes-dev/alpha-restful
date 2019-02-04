const { Entity } = require('../../app')
const restful = require('./restful')

restful.add(new Entity({
    name: 'House',
    resource: 'houses',
    descriptor: {
        description: String,
        info: {
            peoples: [{ id: String, rent: { id: String }, date: Date }],
        },
        address: {
            street: String,
            number: Number,
            city: String,
            contry: { type: String, default: 'Brazil' }
        }
    },
    sync: {
        info: {
            fill: true,
            sync: {
                peoples: { name: 'People', fill: true, jsonIgnoreProperties: ['house'] },
                rent: 'Rent'
            }
        }
    }
}))

restful.add(new Entity({
    name: 'Rent',
    resource: 'rents',
    descriptor: {
        value: Number,
        endOfContract: Date
    }
}))

restful.add(new Entity({
    name: 'People',
    resource: 'peoples',
    descriptor: {
        name: String,
        age: Number
    },
    sync: {
        age: {
            jsonIgnore: true
        },
        house: {
            name: 'House',
            fill: true,
            ignoreFillProperties: ['peoples'],
            syncronized: ['info.peoples']
        }
    }
}))