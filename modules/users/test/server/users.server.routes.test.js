/**
 * Created by Dimitri on 29/09/2017.
 */

const request = require('supertest');
const should = require('should');
const path = require('path');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const config = require(path.resolve('./config/env/config.server'));
const express = require(path.resolve('./config/init-app'));



/**
 * Globals
 */
let app;
let server;
let agent;
let credentials;
let user;



/**
 * User routes tests
 */

describe('User API Routes tests', function () {

    before(function (done) {

        // Get application
        app = require('./config/init-app');
        server = app.startApp();
        agent = request.agent(server);

        done();
    });

    /**
     * Login route
     * POST /api/login
     *
     */

    user = {
        username: admin,
        password: adminpwd,
    };

    describe('POST /api/login', function () {
        it('should be able to login with username successfully and respond with json', function (done) {
            agent.post('/api/login')
                .send(user)
                .expect(200, {
                    success: true,
                    msg: {
                        username: admin,
                    }
                }, done);
        });
    });
});
