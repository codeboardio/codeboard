# Codeboard

Codeboard is a web-based IDE to teach programming in the classroom. This is the core of the Codeboard web application. Part of the codeboard.io project.

### Requirements

Codeboard requires NodeJS, MySQL, MongoDB, and graphicsmagick (for resizing user profile pictures).

* Nodejs: tested with version 0.12.9
* MongoDB: tested with version 2.6.4
* Codeboard has been tested on an Ubuntu 14.04 system.


### Preparing the server

We need to install MySQL and create a database:

```
# Update packages and sources
sudo apt-get update

# Install MySQL and set the the root password
sudo apt-get install mysql-server

# Tell MySQL to create its DB directory structure
sudo mysql_install_db

# Run a security script
sudo mysql_secure_installation

# You should now create a db user with limited privilges and a secure password.
# Then create the database for codeboard using the MySQL command: CREATE SCHEMA `codeboard` ;
# You might also want to create other database, e.g. for testing: CREATE SCHEMA `codeboard-test`;
```

We also need to install MongoDB. Follow the instructions [here](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-14-04).

## Installing Codeboard

Clone the repository to your server
```
git clone https://github.com/codeboardio/codeboard.git
```

Change into the Codeboard folder and install all dependencies
```
cd codeboard

# Install all server dependencies
npm install 

# Make sure to have Bower installed
sudo npm install -g bower

# Install all client dependencies
bower install
```

Codeboard uses Grunt to automate various tasks. Make sure to have the Grunt-CLI installed
```
sudo npm install -g grunt-cli 
```

## Configuring Codeboard

Codeboard requires a number of settings, like database names, passwords, etc.
All those configurations must be set in the following files
```
lib/config/env/all.js
lib/config/env/development.js
lib/config/env/production.js
lib/config/env/test.js
```

## Run and Test Codeboard

Use the following command to run Codeboard (in development mode)
```
grunt serve
```

Build an optimize version for production deployment
```
# Will create a folder dist
# Deploy from dist using command: NODE_ENV=production node server.js
grunt build 
```

Test Codeboard
```
# run client-side tests
grunt test:client

# run server-side tests
grunt test:server
```


### Licensing
This project is available under the MIT license. See [LICENSE](https://github.com/codeboardio/mantra/blob/master/LICENSE) for the full license text.

_Important_: This project may use 3rd party software which uses others licenses. If you're planning to use this project, make sure your use-case complies with all 3rd party licenses.
