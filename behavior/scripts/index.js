'use strict'


const firstOfEntityRole = function(message, entity, role) {
  role = role || 'generic';
  const slots = message.slots
  const entityValues = message.slots[entity]
  const valsForRole = entityValues ? entityValues.values_by_role[role] : null

  return valsForRole ? valsForRole[0] : null
}

exports.handle = function handle(client) {

    const sendGreeting = client.createStep({
	satisfied() {
	    return Boolean(client.getConversationState().greetingSent)
	},
	
	next() {
	    return 'giftOrPersonalStream'
	},

	prompt() {
	    client.addResponse('app:response:name:welcome')
	    client.updateConversationState({
		greetingSent: true
	    })
	    // client.done()
	    return 'init.proceed' // `next` from this step will get called
	}
    })

    const giftOrPersonal = client.createStep({
	satisfied() {
	    const foo = (typeof client.getConversationState().isGift !== 'undefined')
	    return foo
	},

	next() {
	    const isGift = client.getConversationState().isGift
	    if (isGift === true) {
		return 'gift'
	    } else if (isGift === false) {
		return 'personal'
	    }
	},
	
	prompt() {
	    console.log('sending askgift. Why isnt it showing?')
	    client.addTextResponse('why not?')
	    client.addResponse('app:response:name:askgift')
	    client.done()
	}
    })

    
    client.runFlow({
	classifications: {
	},
	autoResponses: {
	},
	streams: {
	    main: 'sendGreetingStream', 
	    sendGreetingStream: [sendGreeting],
	    giftOrPersonalStream: [giftOrPersonal],
	    // gift: [collectInterests],
	    // personal: [askBook],
	    // provideBookonInterests: [provideBookonInterests],

	    //	    end: [provideHelp],
	}
    })
}
