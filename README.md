# Steven Universe Gem API
**Live Website:** https://crystal-gem-api.herokuapp.com/ <br />
**GitHub Repository:** https://github.com/noltron000/crystal-gem-api <hr />

This API's goal is to help serve information about gem characters in the Steven Universe cartoon series in a more digestable format. Gem's have fusions and vice versa. Both of these items also have Special Weapons and Secret Powers.

> *What's Steven Universe? It's a popular cartoon directed by Rebecca Sugar.<br />*
> *See http://steven-universe.wikia.com/wiki/Steven_Universe_Wiki*

## Using the Website
The API has a modest frontend for ease of use. The website is hosted on Heroku @ https://crystal-gem-api.herokuapp.com/

### Overview
| Route              | Functionality                                 |
|:-------------------|:----------------------------------------------|
| `/`                | Displays basic information                    |
| `/gem`             | Displays all gems                             |
| `/gem/json`        | Displays all gems in `JSON` format            |
| `/gem/new`         | Displays new gem form                         |
| `/gem/:id`         | Displays one gem's detail                     |
| `/gem/:id/json`    | Displays one gem's detail in `JSON` format    |
| `/gem/:id/edit`    | Displays gem edit form                        |
| `/fusion`          | Displays all fusions                          |
| `/fusion/json`     | Displays all fusions in `JSON` format         |
| `/fusion/new`      | Displays new fusion form                      |
| `/fusion/:id`      | Displays one fusion's detail                  |
| `/fusion/:id/json` | Displays one fusion's detail in `JSON` format |
| `/fusion/:id/edit` | Displays fusion edit form                     |

## Getting Started Locally
*Here's a step-by-step guide to set this API up locally on your computer.*
1. Set up project files locally
	1. Fork <a href="https://github.com/noltron000/crystal-gem-api">this repo</a>.
	1. Open terminal; `cd` into your preferred repo library location
	1. Clone your new fork into this location
	1. `cd` into the new clone
1. Host environment locally
	1. Run `yarn install` in your terminal instance to initialize requirements
	1. Copy `.env.example` to `.env`, set `MONGODB_URI` to your MongoDB connection string, and optionally choose an integer `PORT` (default: `4040`)
	1. Run `yarn start` in your terminal to host the website locally
	1. Navigate to `http://localhost:4040/`, or replace `4040` with your configured port
	1. modify and digest data that you alone can access
		- TIP: *this data is stored locally on your computer*
	1. use the apps `/json` routes to retrieve data as you please

## Definitions
***What are gems?***
*Gems* are metaphysical beings, and their form is projected from the heart of their existance - their jewel. Unlike people, gems can die many times, don't need to sleep, eat or breath, and have special weapons and secret powers.

***What are fusions?***
*Fusions* are super-powerful combinations of gems, achieved through an extraordinary connection. Their mind and body form into one.

## Aspirations
In future iterations, it would be nice to include:
- User provisioning
- Tests & error handling
- Structure refactoring
