# events-constructor

[![npm](https://img.shields.io/npm/v/events-constructor?style=flat-square)](https://www.npmjs.com/package/events-constructor)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/events-constructor?style=flat-square)

Class for emitting events

## Install

npm

```sh
npm install events-constructor
```

yarn

```sh
yarn add events-constructor
```

## Usage

```js
import Events from 'events-constructor';

const eventNames = ['event1', 'event2'];
const events = new Events(initEventNames);

events.on('event1', data => {
  console.log('event1 is called with data:', data);
});

events.trigger('event1', 'some data');
```

## API

### events.on

Add listener to event

```js
events.on('event1', data => {
  console.log('event1 is called with data:', data);
});
```

### events.once

Add a listener that will be called only once per event

```js
events.once('event1', data => {
  console.log('event1 is called with data:', data);
});
```

### events.off

Remove listener from event

```js
events.off('event1', data => {
  console.log('event1 is called with data:', data);
});
```

### events.trigger

Trigger event with data

```js
events.trigger('event1', 'some data');
```

### events.removeEventHandlers

Remove all listeners

```js
events.removeEventHandlers();
```

### events.triggers

Get all triggers

```js
events.triggers;
```

### events.deactivate()

Disable event handlers. The trigger method will not produce any effect.

```js
events.on('event1', data => {
  console.log('event1 is called with data:', data); //it's not called
});

events.deactivate();
events.trigger('event1', 'some data');
```

### events.activate()

Enable event handlers.

```js
events.on('event1', data => {
  console.log('event1 is called with data:', data);
});

events.deactivate();
events.trigger('event1', 'some data'); // no effect

events.activate();
events.trigger('event1', 'some data'); // handler is called
```

### events.eachTriggers()

Method for delegate triggers to otherEventsSource(for example)

```js
events.eachTriggers((trigger, eventName) => otherEventsSource.on(eventName, trigger));
```

## Run tests

```sh
npm test
```

## Maintainer

👤 **Krivega Dmitriy**

- Website: https://krivega.com
- Github: [@Krivega](https://github.com/Krivega)

## Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Krivega/events-constructor/issues). You can also take a look at the [contributing guide](https://github.com/Krivega/events-constructor/blob/master/CONTRIBUTING.md).

## 📝 License

Copyright © 2020 [Krivega Dmitriy](https://github.com/Krivega).<br />
This project is [MIT](https://github.com/Krivega/events-constructor/blob/master/LICENSE) licensed.
