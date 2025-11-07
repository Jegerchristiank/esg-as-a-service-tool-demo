import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type {
  PersistedWizardProfile,
  PersistedWizardStorage,
  WizardPersistenceSnapshot,
} from '@org/shared/wizard/persistence'

const PROFILE_KEYS = [
  'hasVehicles',
  'hasHeating',
  'hasIndustrialProcesses',
  'usesRefrigerants',
  'hasBackupPower',
  'hasOpenFlames',
  'hasLabGas',
  'usesElectricity',
  'usesDistrictHeating',
  'hasPpaContracts',
  'hasGuaranteesOfOrigin',
  'leasesWithOwnMeter',
  'exportsEnergy',
  'purchasesMaterials',
  'hasTransportSuppliers',
  'generatesWaste',
  'leasesEquipment',
  'shipsGoodsUpstream',
  'usesGlobalFreight',
  'hasConsultantsTravel',
  'purchasesElectronics',
  'producesProducts',
  'leasesProducts',
  'hasFranchisePartners',
  'providesCustomerServices',
  'hasProductRecycling',
  'shipsFinishedGoods',
  'usesLargeWaterVolumes',
  'hasIndustrialEmissions',
  'impactsNatureAreas',
  'managesCriticalMaterials',
  'hasInvestments',
  'ownsSubsidiaries',
  'operatesInternationalOffices',
  'hasEsgPolicy',
  'hasSupplierCode',
  'doesEsgReporting',
  'hasBoardOversight',
  'isIso14001Certified',
  'hasNetZeroTarget',
  'hasDataInfrastructure',
  'hasMaterialTopics',
  'hasMaterialRisks',
  'hasMaterialOpportunities',
  'hasCsrdGapAssessment',
  'hasTransitionPlan',
  'assessesClimateResilience',
  'tracksFinancialEffects',
  'hasRemovalProjects',
] as const

const COMPLETED_PROFILE = PROFILE_KEYS.reduce<PersistedWizardProfile['profile']>((acc, key) => {
  acc[key] = true
  return acc
}, {} as PersistedWizardProfile['profile'])

const COMPLETED_STORAGE: PersistedWizardStorage = {
  activeProfileId: 'e2e-profile',
  profiles: {
    'e2e-profile': {
      id: 'e2e-profile',
      name: 'E2E profil',
      state: {},
      profile: COMPLETED_PROFILE,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
      history: {},
      responsibilities: {},
      version: 1,
    },
  },
}

type SnapshotPayload = WizardPersistenceSnapshot

const DEFAULT_SNAPSHOT: SnapshotPayload = {
  storage: COMPLETED_STORAGE,
  auditLog: [],
  permissions: { canEdit: true, canPublish: false },
  user: { id: 'e2e-user', roles: [] },
}

const EXPECTED_SCOPE_LABELS = ['Scope 1', 'Scope 2', 'Scope 3', 'Environment', 'Social', 'Governance'] as const

const MULTI_PROFILE_STORAGE: PersistedWizardStorage = {
  activeProfileId: 'profile-nordic',
  profiles: {
    'profile-nordic': createProfileEntry('profile-nordic', 'Nordic Industri', 1_700_000_900_000),
    'profile-logistics': createProfileEntry('profile-logistics', 'Logistik A/S', 1_700_000_800_000, {
      hasVehicles: true,
      hasHeating: true,
      hasIndustrialProcesses: false,
    }),
    'profile-retail': createProfileEntry('profile-retail', 'Retail DK', 1_700_000_700_000, {
      usesElectricity: true,
      purchasesMaterials: false,
      hasConsultantsTravel: true,
    }),
    'profile-services': createProfileEntry('profile-services', 'Services Global', 1_700_000_600_000, {
      hasGuaranteesOfOrigin: true,
      leasesWithOwnMeter: false,
      hasFranchisePartners: true,
    }),
    'profile-energy': createProfileEntry('profile-energy', 'Energi Hub', 1_700_000_500_000, {
      usesDistrictHeating: true,
      hasBackupPower: true,
      hasIndustrialEmissions: true,
    }),
    'profile-tech': createProfileEntry('profile-tech', 'Tech Partners', 1_700_000_400_000, {
      hasDataInfrastructure: true,
      hasNetZeroTarget: true,
      hasTransitionPlan: true,
    }),
    'profile-supply': createProfileEntry('profile-supply', 'Supply Unit', 1_700_000_300_000, {
      shipsFinishedGoods: true,
      leasesProducts: false,
      hasSupplierCode: true,
    }),
    'profile-holding': createProfileEntry('profile-holding', 'Holding ApS', 1_700_000_200_000, {
      operatesInternationalOffices: true,
      hasInvestments: true,
      hasBoardOversight: true,
    }),
  },
}

type ProfileOverrides = Partial<Record<keyof PersistedWizardProfile['profile'], boolean>>

function createProfileEntry(
  id: string,
  name: string,
  updatedAt: number,
  overrides: ProfileOverrides = {},
): PersistedWizardProfile {
  const profile: PersistedWizardProfile['profile'] = { ...COMPLETED_PROFILE }

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'boolean') {
      profile[key] = value
    }
  }

  return {
    id,
    name,
    state: {},
    profile,
    createdAt: updatedAt - 10_000,
    updatedAt,
    history: {},
    responsibilities: {},
    version: 1,
  }
}

async function stubWizardSnapshot(page: Page, override?: Partial<SnapshotPayload>) {
  const payload: SnapshotPayload = {
    ...DEFAULT_SNAPSHOT,
    ...override,
  }

  await page.route('**/wizard/snapshot', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      })
      return
    }

    if (method === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      })
      return
    }

    await route.fallback()
  })
}

async function performPasswordLogin(page: Page, redirectPath = '/') {
  const target = new URL('/access', 'http://localhost')
  if (redirectPath !== '/') {
    target.searchParams.set('redirect', redirectPath)
  }

  await page.goto(`${target.pathname}${target.search}`)

  const passwordInput = page.getByLabel('Adgangskode')
  await expect(passwordInput).toBeVisible()
  await passwordInput.fill('esg-as-a-service')

  const submitButton = page.getByRole('button', { name: 'Fortsæt' })
  const expectedLocation = new URL(redirectPath, 'http://localhost')

  await Promise.all([
    page.waitForURL((url) => url.pathname === expectedLocation.pathname && url.search === expectedLocation.search),
    submitButton.click(),
  ])

  await expect(page).toHaveURL(
    (url) => url.pathname === expectedLocation.pathname && url.search === expectedLocation.search,
  )
}

async function openWizard(page: Page) {
  await stubWizardSnapshot(page)
  await performPasswordLogin(page, '/?ff_wizardRedesign=on')
  await page.waitForLoadState('networkidle')

  const currentUrl = new URL(page.url())
  if (currentUrl.pathname !== '/' || currentUrl.search !== '?ff_wizardRedesign=on') {
    await page.goto('/?ff_wizardRedesign=on')
  }
  const resumeButton = page.getByRole('button', { name: /Fortsæt seneste profil|Åbn seneste profil/ })
  if (await resumeButton.isEnabled()) {
    await resumeButton.click()
  } else {
    await page.getByRole('button', { name: /Opret ny profil|Ny profil/ }).click()
  }
  await page.waitForURL('**/wizard')
  await expect(page.getByRole('heading', { name: 'ESG-beregninger' })).toBeVisible()
  await expect(page.getByTestId('wizard-top-nav')).toBeVisible()

  const profileAdvanceButton = page.getByRole('button', {
    name: /Start profil|Næste sektion|Find næste ubesvarede|Fortsæt til moduler/,
  })

  if (await profileAdvanceButton.isVisible()) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const label = (await profileAdvanceButton.textContent())?.trim() ?? ''
      if (/Fortsæt til moduler/i.test(label)) {
        await profileAdvanceButton.click()
        break
      }

      await profileAdvanceButton.click()
      await page.waitForTimeout(120)
    }
  }

  await expect(page.getByTestId('wizard-navigation')).toBeVisible()
}

test.describe('Wizard layout', () => {
  test('kan starte wizard og navigere mellem moduler', async ({ page }) => {
    await openWizard(page)

    const navigation = page.getByTestId('wizard-navigation')
    const navigationTabs = navigation.getByRole('tab')
    const tabCount = await navigationTabs.count()
    expect(tabCount).toBeGreaterThan(0)

    const initiallyActiveTab = navigation.getByRole('tab', { selected: true }).first()
    await expect(initiallyActiveTab).toBeVisible()
    const initialActiveLabel = await initiallyActiveTab.getAttribute('aria-label')

    if (tabCount > 1) {
      const secondTab = navigationTabs.nth(1)
      await expect(secondTab).toBeVisible()
      await secondTab.click()
      await expect(secondTab).toHaveAttribute('data-active', 'true')
      await expect(secondTab).toHaveAttribute('aria-selected', 'true')
      await expect(navigation.getByRole('tab', { selected: true })).toHaveCount(1)
      if (initialActiveLabel) {
        await expect(
          navigation.getByRole('tab', { name: initialActiveLabel, exact: true })
        ).not.toHaveAttribute('aria-selected', 'true')
      }

      const firstTab = navigationTabs.first()
      await firstTab.click()
      await expect(firstTab).toHaveAttribute('data-active', 'true')
      await expect(firstTab).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('kan vende tilbage til landing via top handling', async ({ page }) => {
    await openWizard(page)

    const homeLink = page.getByRole('link', { name: 'Til forsiden' })
    await expect(homeLink).toBeVisible()

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/' && url.search === ''),
      homeLink.click(),
    ])

    await expect(page.getByRole('heading', { name: 'ESG-rapportering' })).toBeVisible()
  })

  test('mobil navigation kan åbnes som slide-in med aktiv overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await openWizard(page)

    const navigationRoot = page.locator('.wizard-shell__navigation')
    const navTrigger = page.getByRole('button', { name: 'Moduloversigt' })
    await expect(navTrigger).toBeEnabled()
    await navTrigger.click()
    const navigation = page.getByTestId('wizard-navigation')

    await expect(navigationRoot).toHaveAttribute('data-open', 'true')
    await expect(navigation).toBeVisible()

    await page.waitForFunction(() => {
      const panel = document.querySelector('[data-testid="wizard-navigation"]')
      if (!panel) {
        return false
      }
      const rect = panel.getBoundingClientRect()
      return rect.left >= 0
    })

    const panelRect = await navigation.evaluate((element) => {
      const { left, right } = element.getBoundingClientRect()
      return { left, right }
    })
    expect(panelRect.left).toBeGreaterThanOrEqual(0)
    expect(panelRect.right - panelRect.left).toBeGreaterThan(200)

    const overlayStyles = await navigationRoot.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        pointerEvents: style.pointerEvents,
        opacity: parseFloat(style.opacity),
      }
    })
    expect(overlayStyles.pointerEvents).toBe('auto')
    expect(overlayStyles.opacity).toBeGreaterThan(0.9)

    await page.getByRole('button', { name: 'Luk' }).click()
    await expect(navigationRoot).not.toHaveAttribute('data-open', 'true')
    await page.waitForFunction(() => {
      const panel = document.querySelector('[data-testid="wizard-navigation"]')
      if (!panel) {
        return false
      }
      const rect = panel.getBoundingClientRect()
      return rect.right <= 2
    })
  })

  test('sticky top- og bottom-bar forbliver i viewporten ved scroll', async ({ page }) => {
    await openWizard(page)

    const topNav = page.getByTestId('wizard-top-nav')
    const navigation = page.getByTestId('wizard-navigation')
    const recommendedButton = navigation.getByRole('tab', { selected: true }).first()
    const bottomBar = page.locator('.wizard-shell__bottom-bar')

    await expect(recommendedButton).toHaveAttribute('data-active', 'true')
    await recommendedButton.click()
    await expect(recommendedButton).toHaveAttribute('data-active', 'true')

    const initialTopBox = await topNav.boundingBox()
    expect(initialTopBox).not.toBeNull()

    await page.evaluate(() => window.scrollBy(0, 200))

    const scrolledTopBox = await topNav.boundingBox()
    expect(scrolledTopBox).not.toBeNull()
    expect(Math.abs(scrolledTopBox!.y ?? 0)).toBeLessThan(2)

    await expect(bottomBar).toBeVisible()

    const viewportHeight = await page.evaluate(() => window.innerHeight)
    const rootFontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
    const expectedOffset = rootFontSize * 1.5
    const styles = await bottomBar.evaluate((element) => {
      const style = getComputedStyle(element)
      return { position: style.position, bottom: style.bottom }
    })
    expect(styles.position).toBe('sticky')
    expect(Math.abs(parseFloat(styles.bottom) - expectedOffset)).toBeLessThan(1)

    const rect = (await bottomBar.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect()
      return { top, bottom }
    })) as { top: number; bottom: number }
    expect(rect.top).toBeGreaterThanOrEqual(0)
    expect(rect.bottom).toBeLessThanOrEqual(viewportHeight)
  })

  test('profile switcher viser tabellayout med søgning på desktop', async ({ page }) => {
    await stubWizardSnapshot(page, { storage: MULTI_PROFILE_STORAGE })
    await page.goto('/?ff_wizardRedesign=on')
    await page.waitForLoadState('networkidle')

    const switcher = page.getByTestId('profile-switcher')
    await expect(switcher).toBeVisible()
    await expect(switcher.locator('.ds-profile-switcher__table')).toBeVisible()

    const headerCells = await switcher.locator('.ds-profile-table thead th').allInnerTexts()
    expect(headerCells.map((text) => text.trim())).toEqual([
      'Navn',
      'Sidst opdateret',
      'Scopes',
      'Handlinger',
    ])

    const searchField = switcher.getByPlaceholder('Søg profiler eller scopes')
    await searchField.waitFor({ state: 'visible' })

    const totalProfiles = Object.keys(MULTI_PROFILE_STORAGE.profiles).length
    const rows = switcher.locator('.ds-profile-table tbody tr')
    await expect(rows).toHaveCount(totalProfiles)

    await searchField.fill('Retail')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Retail DK')

    await searchField.fill('')
    await expect(rows).toHaveCount(totalProfiles)

    const firstRowMenu = rows.first().locator('.ds-profile-menu')
    const desktopMenuButton = firstRowMenu.getByRole('button', { name: /handlingsmenu/i })
    await desktopMenuButton.click()
    await expect(firstRowMenu.locator('.ds-profile-menu__panel')).toHaveAttribute('data-open', 'true')

    const scopeRows = await rows
      .first()
      .locator('td')
      .nth(2)
      .locator('li')
      .allInnerTexts()
    expect(scopeRows.map((text) => text.trim())).toEqual([...EXPECTED_SCOPE_LABELS])

    const actionButtons = firstRowMenu.locator('.ds-profile-menu__panel').getByRole('button')
    await expect(actionButtons).toHaveCount(3)
    await expect(actionButtons.nth(0)).toHaveAccessibleName('Omdøb profil')
    await expect(actionButtons.nth(1)).toHaveAccessibleName('Dupliker profil')
    await expect(actionButtons.nth(2)).toHaveAccessibleName('Slet profil')
  })

  test('profile switcher viser kortliste og drawer på mobil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await stubWizardSnapshot(page, { storage: MULTI_PROFILE_STORAGE })
    await page.goto('/?ff_wizardRedesign=on')

    const switcher = page.getByTestId('profile-switcher')
    const cards = switcher.locator('.ds-profile-switcher__list > li')
    await expect(cards).toHaveCount(Object.keys(MULTI_PROFILE_STORAGE.profiles).length)

    const firstCard = cards.first()
    const mobileMenu = firstCard.locator('.ds-profile-menu')
    const menuButton = mobileMenu.getByRole('button', { name: /handlingsmenu/i })
    await menuButton.click()
    await expect(mobileMenu.locator('.ds-profile-menu__panel')).toHaveAttribute('data-open', 'true')

    const activationButton = firstCard.getByRole('button', { name: 'Aktivér' })
    await expect(activationButton).toBeDisabled()

    await expect(firstCard.locator('.ds-profile-card__heading .ds-status-badge')).toHaveText('Aktiv')

    const scopeBadges = firstCard.locator('.ds-cluster .ds-status-badge')
    await expect(scopeBadges).toHaveCount(EXPECTED_SCOPE_LABELS.length)
    const scopeTexts = await scopeBadges.allInnerTexts()
    expect(scopeTexts.map((text) => text.trim())).toEqual([...EXPECTED_SCOPE_LABELS])

    const actionButtons = mobileMenu.locator('.ds-profile-menu__panel').getByRole('button')
    await expect(actionButtons).toHaveCount(3)
    await expect(actionButtons.nth(0)).toHaveAccessibleName('Omdøb profil')
    await expect(actionButtons.nth(1)).toHaveAccessibleName('Dupliker profil')
    await expect(actionButtons.nth(2)).toHaveAccessibleName('Slet profil')
  })
})

test.describe('Feature flags', () => {
  test('landing page falder tilbage til klassisk layout når redesign flag er slukket', async ({ page }) => {
    await stubWizardSnapshot(page, { storage: MULTI_PROFILE_STORAGE })
    await page.goto('/?ff_wizardRedesign=off')

    await expect(page.getByText('Version 3 · Klassisk UI')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Åbn seneste profil' })).toBeVisible()
  })
})
