const { Entity } = require('../../app')
const restful = require('./restful')
const mongoose = require('mongoose')

restful.add(new Entity({
    name: 'House',
    resource: 'houses',
    methods: ['get', 'post', 'put', 'delete', 'patch'],
    descriptor: {
        description: String,
        info: {
            peoples: [{ id: mongoose.Types.ObjectId, rent: { id: mongoose.Types.ObjectId }, date: Date }],
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
            subFill: true,
            sync: {
                peoples: { 
                    name: 'People', 
                    fill: true, 
                    jsonIgnoreProperties: ['houses'],
                    sync: {
                        rent: 'Rent'
                    }
                }
            }
        }
    }
}))

restful.add(new Entity({
    name: 'Rent',
    resource: 'rents',
    methods: ['get', 'post', 'put', 'delete', 'patch'],
    descriptor: {
        value: Number,
        endOfContract: Date
    }
}))

restful.add(new Entity({
    name: 'People',
    resource: 'peoples',
    methods: ['get', 'post', 'put', 'delete', 'patch'],
    descriptor: {
        name: String,
        age: Number
    },
    sync: {
        age: {
            jsonIgnore: false
        },
        houses: {
            name: 'House',
            fill: true,
            ignoreFillProperties: ['peoples'],
            syncronized: ['info.peoples']
        }
    }
}))