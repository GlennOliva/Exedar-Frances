export interface SeedUser { id: string }
export interface AdminSeedDependencies {
  findUserByEmail(email: string): Promise<SeedUser | null>
  verifyCredentials(email: string, password: string): Promise<SeedUser | null>
  createUser(email: string, password: string): Promise<SeedUser>
  hasAdminRole(userId: string): Promise<boolean>
  assignAdminRole(userId: string): Promise<void>
}

export async function seedAdmin(email: string, password: string, dependencies: AdminSeedDependencies) {
  let user = await dependencies.findUserByEmail(email)
  let created = false
  if (user) {
    if (await dependencies.hasAdminRole(user.id)) return { created: false, roleAssigned: false, alreadyProvisioned: true }
    const verified = await dependencies.verifyCredentials(email, password)
    if (!verified || verified.id !== user.id) throw new Error('Existing account identity could not be verified; no password or role was changed.')
  } else {
    user = await dependencies.createUser(email, password)
    created = true
  }

  await dependencies.assignAdminRole(user.id)
  return { created, roleAssigned: true, alreadyProvisioned: false }
}
