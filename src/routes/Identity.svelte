<script lang="ts">
	import { getPublicKey, nip19 } from 'nostr-tools';
	import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
	import copy from 'copy-to-clipboard';

	import { createNip07Signer, ncryptStore } from '$lib';
	import QrCode from './QrCode.svelte';
	let { ncrypt, name }: { name: string; ncrypt: string } = $props();

	let passphrase = $state<string>();
	let unlocked = $state<Uint8Array>();
	let sk = $derived.by(() => {
		if (unlocked) return unlocked;
		const skHex = ncryptStore.getUnlockedIdentity(name);
		if (!skHex) return;
		return hexToBytes(skHex);
	});
	let pubkey = $derived(sk ? getPublicKey(sk) : undefined);
	let nsec = $derived(sk ? nip19.nsecEncode(sk) : undefined);
	let npub = $derived(pubkey ? nip19.npubEncode(pubkey) : undefined);
	let shareUrl = $state<string>();

	function handleUnlock(event: Event) {
		event.preventDefault();
		if (!passphrase) return;
		unlocked = ncryptStore.unlockIdentity(name, passphrase);
	}

	function handleShare() {
		if (shareUrl) {
			shareUrl = undefined;
			return;
		}
		const url = new URL(window.location.href);
		url.searchParams.set('ncrypt', ncrypt);
		url.searchParams.set('name', name);
		shareUrl = url.toString();
	}

	function forgetIdentity(name: string) {
		const c = confirm('Are you sure you want to forget this identity?');
		if (!c) return;
		ncryptStore.forgetIdentity(name);
	}

	function handleActivate(name: string) {
		ncryptStore.activateIdentity(name);
	}
</script>

<div>
	{#if !sk}
		<p>Unlock with passphrase</p>
		<form onsubmit={handleUnlock}>
			<input type="password" class="input input-bordered" bind:value={passphrase} />
			<button type="submit" class="btn">Unlock</button>
		</form>
	{:else}
		<div class="flex flex-col gap-y-2">
			<div class="grid grid-cols-3 items-center">
				<b>Npub</b>
				<p class="truncate">{npub}</p>
				<button
					class="btn btn-ghost"
					onclick={() => {
						copy(npub as string);
					}}
				>
					Copy
				</button>
			</div>
			<div class="grid grid-cols-3 items-center">
				<b>Nsec</b>
				<p class="truncate">{nsec}</p>
				<button
					class="btn btn-ghost"
					onclick={() => {
						copy(nsec as string);
					}}
				>
					Copy
				</button>
			</div>
			<div class="grid grid-cols-3 items-center">
				<b>Pubkey (Hex)</b>
				<p class="truncate">{pubkey}</p>
				<button
					class="btn btn-ghost"
					onclick={() => {
						copy(pubkey as string);
					}}
				>
					Copy
				</button>
			</div>
			<div class="grid grid-cols-3 items-center">
				<b>Private Key (hex)</b>
				<p class="truncate">{bytesToHex(sk)}</p>
				<button
					class="btn btn-ghost"
					onclick={() => {
						copy(bytesToHex(sk!));
					}}
				>
					Copy
				</button>
			</div>
		</div>
	{/if}
	<div class="mt-4 w-full flex gap-x-3">
		<button onclick={() => handleShare()} class="btn btn-sm btn-info">Share</button>
		{#if sk}
			<button onclick={() => handleActivate(name)} class="btn btn-sm btn-info">Activate</button>
		{/if}
		<button onclick={() => forgetIdentity(name)} class="btn btn-sm btn-error">Forget</button>
	</div>
	{#if shareUrl}
		<div class="flex flex-col gap-y-2 mt-4">
			<QrCode value={shareUrl} />
			<div class="flex gap-x-2">
				<input type="text" class="input input-bordered w-full" value={shareUrl} readonly />
				<button class="btn btn-ghost" onclick={() => copy(shareUrl!)}>Copy</button>
			</div>
		</div>
	{/if}
</div>
