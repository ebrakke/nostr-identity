<script lang="ts">
	import { ncryptStore } from '$lib';
	import { onMount } from 'svelte';
	import Identity from './Identity.svelte';

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const ncrypt = params.get('ncrypt');
		const name = params.get('name');
		if (ncrypt && name) {
			ncryptStore.addIdentity(name, ncrypt);
			// Remove the query params
			const url = new URL(window.location.href);
			url.searchParams.delete('ncrypt');
			url.searchParams.delete('name');
			history.replaceState(null, '', url.toString());
		}

		window.onbeforeunload = () => {
			sessionStorage.clear();
		};
	});

	function handleCreateNewIdentity(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const name = formData.get('name') as string;
		const passphrase = formData.get('passphrase') as string;
		ncryptStore.createNewIdentity(name, passphrase);

		form.reset();
	}

	function handleCreateFromNsec(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const name = formData.get('name') as string;
		const nsec = formData.get('nsec') as string;
		const passphrase = formData.get('passphrase') as string;
		ncryptStore.createNcryptFromNsec(name, nsec, passphrase);

		form.reset();
	}
</script>

<div class="flex flex-col gap-y-8">
	<div>
		<form onsubmit={handleCreateNewIdentity}>
			<label class="input input-bordered flex items-center gap-2">
				Name
				<input type="text" class="grow" placeholder="Name for identity" name="name" />
			</label>
			<label class="input input-bordered flex items-center gap-2">
				Passphrase
				<input
					type="password"
					class="grow"
					placeholder="Passphrase to encrypt identity"
					name="passphrase"
				/>
			</label>
			<button class="btn">Create New Identity</button>
		</form>
	</div>
	<div>
		<form onsubmit={handleCreateFromNsec}>
			<label class="input input-bordered flex items-center gap-2">
				Name
				<input type="text" class="grow" placeholder="Name for identity" name="name" />
			</label>
			<label class="input input-bordered flex items-center gap-2">
				Nsec
				<input type="password" class="grow" placeholder="nsec..." name="nsec" />
			</label>
			<label class="input input-bordered flex items-center gap-2">
				Passphrase
				<input
					type="password"
					class="grow"
					placeholder="Passphrase to encrypt identity"
					name="passphrase"
				/>
			</label>
			<button class="btn">Import Identity</button>
		</form>
	</div>

	{#if $ncryptStore.length > 0}
		<h2>Identities</h2>
		<div class="flex flex-col gap-y-2">
			{#each $ncryptStore as identity}
				<div class="collapse bg-base-200">
					<input type="checkbox" />
					<div class="collapse-title text-xl font-medium">
						{identity.name}
					</div>
					<div class="collapse-content overflow-hidden">
						<Identity name={identity.name} ncrypt={identity.ncrypt} />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
