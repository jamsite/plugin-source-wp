# plugin-source-wp

Wordpress Jamsite source plugin. Reads Wordpress site data with rest api.

## Install

`npm i @jamsite/plugin-source-wp`

## Cache

Downloaded data may be serialized and saved in cache directory as json files.

## Options

- `refreshCache [default:false]` - refetch data and update cache
- `useCache [default:true]` - enable cache
- `endpoint` - wp rest-api endpoint
- `exclude` - array of content types to exclude
