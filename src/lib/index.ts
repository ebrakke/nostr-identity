import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent, generateSecretKey, getPublicKey, nip19, type EventTemplate, type VerifiedEvent } from "nostr-tools";
import * as nip49 from "nostr-tools/nip49";
import { writable, get } from "svelte/store";

type NcryptEntry = {
	name: string;
	ncrypt: string;
}

const storageKey = "nostr-identity:ncrypts";
const skKey = "nostr-identity:sk";

const createNcryptStore = () => {
	const ncrypts = writable<NcryptEntry[]>([], set => {
		const json = localStorage.getItem(storageKey);
		if (json) {
			set(JSON.parse(json));
		}
	});

	const activeIdentity = writable<string | null>(null);

	const activateIdentity = (name: string) => {
		const sk = getUnlockedIdentity(name);
		if (!sk) {
			throw new Error('Identity not unlocked');
		}
		activeIdentity.set(name);
		(window as any).nostr = createNip07Signer(name);
	};

	const createNcryptFromNsec = (name: string, nsec: string, passphrase: string) => {
		const decoded = nip19.decode(nsec);
		if (decoded.type !== 'nsec') {
			throw new Error('Invalid NSEC');
		}
		const ncrypt = nip49.encrypt(decoded.data, passphrase);
		ncrypts.update(ncrypts => {
			const entry = { name, ncrypt };
			localStorage.setItem(storageKey, JSON.stringify([...ncrypts, entry]));
			return [...ncrypts, entry];
		});
	};

	const createNewIdentity = (name: string, passphrase: string) => {
		const sk = generateSecretKey();
		const nsec = nip19.nsecEncode(sk);
		createNcryptFromNsec(name, nsec, passphrase);
	}

	const forgetIdentity = (name: string) => {
		ncrypts.update(ncrypts => {
			const newNcrypts = ncrypts.filter(e => e.name !== name);
			localStorage.setItem(storageKey, JSON.stringify(newNcrypts));
			return newNcrypts;
		});
	}

	const addIdentity = (name: string, ncrypt: string) => {
		ncrypts.update(ncrypts => {
			const entry = { name, ncrypt };
			localStorage.setItem(storageKey, JSON.stringify([...ncrypts, entry]));
			return [...ncrypts, entry];
		});
	}

	const unlockIdentity = (name: string, passphrase: string) => {
		const ncrypt = get(ncrypts).find(e => e.name === name);
		if (!ncrypt) {
			throw new Error('Identity not found');
		}
		const decoded = nip49.decrypt(ncrypt.ncrypt, passphrase);
		if (!decoded) {
			throw new Error('Invalid passphrase');
		}
		sessionStorage.setItem(`${skKey}:${name}`, bytesToHex(decoded));
		return decoded;
	};

	const getUnlockedIdentity = (name: string) => {
		const sk = sessionStorage.getItem(`${skKey}:${name}`);
		if (!sk) return null;
		return sk
	};

	return { subscribe: ncrypts.subscribe, createNcryptFromNsec, createNewIdentity, forgetIdentity, addIdentity, unlockIdentity, getUnlockedIdentity, activeIdentity, activateIdentity };
}

interface Nip07Signer {
	getPublicKey(): Promise<string>;
	signEvent(event: EventTemplate): Promise<VerifiedEvent>
}

export const createNip07Signer = (name: string): Nip07Signer => {
	const skHex = ncryptStore.getUnlockedIdentity(name);
	if (!skHex) {
		throw new Error('Invalid passphrase');
	}
	const sk = hexToBytes(skHex);
	const pk = getPublicKey(sk);
	return {
		getPublicKey: async () => pk,
		signEvent: async (event: EventTemplate) => finalizeEvent(event, sk)
	}
}

export const ncryptStore = createNcryptStore();
