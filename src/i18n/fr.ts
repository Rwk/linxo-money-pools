export const fr = {
  navigation: {
    homeLabel: "Linxo Cagnottes — Accueil",
    primary: "Navigation principale",
    menu: "Menu",
    openMenu: "Ouvrir le menu de navigation",
    closeMenu: "Fermer le menu de navigation",
    home: "Accueil",
    account: "Compte",
    skipToContent: "Aller au contenu"
  },
  common: {
    appName: "Linxo Cagnottes",
    appDescription: "Cagnottes propulsées par Linxo Payments.",
    appNameAlt: "Cagnottes Linxo Payments",
    internalMvp: "MVP interne",
    employeeAccess: "Accès collaborateurs",
    backToHome: "Retour à l'accueil",
    backToDashboard: "Retour au tableau de bord",
    openDashboard: "Ouvrir le tableau de bord",
    accessDashboard: "Accéder à mon tableau de bord",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    signInWithGoogle: "Se connecter avec Google",
    signInDevelopment: "Connexion développeur",
    signInToManagePools: "Se connecter pour gérer mes cagnottes",
    loading: "Chargement...",
    save: "Enregistrer",
    saving: "Enregistrement...",
    cancel: "Annuler",
    edit: "Modifier",
    create: "Créer",
    creating: "Création...",
    configure: "Configurer",
    configuring: "Configuration...",
    continue: "Continuer",
    redirecting: "Redirection...",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié",
    copyFailed: "Impossible de copier le lien",
    anonymous: "Anonyme",
    hiddenAmount: "Montant masqué",
    email: "E-mail",
    amountEur: "Montant en EUR",
    qrCodeLabel: "QR code de paiement"
  },
  home: {
    title: "Créez, partagez et suivez des cagnottes Linxo.",
    body:
      "Les collaborateurs Linxo peuvent créer une cagnotte, partager un lien public non devinable et suivre les statuts de contribution envoyés via Linxo Payments.",
    disclaimer:
      "Ce produit aide à organiser les contributions. Il ne conserve pas les fonds et une contribution n'est confirmée qu'après les mises à jour de statut Linxo.",
    signedInHint: "Vous êtes déjà connecté avec un compte collaborateur Linxo.",
    heroHighlights: {
      createPool: "Créez une cagnotte",
      sharePublicLink: "Partagez un lien public",
      collectSecureTransfers: "Recevez des contributions par virement sécurisé",
      trackStatuses: "Suivez les statuts de paiement"
    },
    stepsTitle: "Comment cela fonctionne",
    stepsBody:
      "Un parcours simple pour lancer une cagnotte, la partager et suivre les contributions sans changer les flux de paiement existants.",
    steps: {
      create: {
        title: "Créez une cagnotte",
        body:
          "Choisissez un titre, une description, une date de clôture et un type d'événement."
      },
      setupCollector: {
        title: "Configurez le compte collecteur",
        body:
          "Les informations sont transmises à Linxo Payments pour enregistrer le compte de réception."
      },
      share: {
        title: "Partagez le lien public",
        body:
          "Les participants peuvent accéder à la cagnotte sans créer de compte."
      },
      contribute: {
        title: "Les participants contribuent",
        body:
          "Ils choisissent un montant et valident un virement via le parcours Linxo."
      },
      track: {
        title: "Suivez les statuts",
        body:
          "Les webhooks et le rafraîchissement manuel permettent de suivre les contributions."
      },
      responsibility: {
        title: "Le collecteur reste responsable",
        body:
          "Les fonds sont reçus directement par le collecteur désigné pour la cagnotte."
      }
    },
    trustTitle: "Sécurité et cadre de fonctionnement",
    trustBody:
      "L'application sépare l'accès de gestion, le partage public et le traitement des paiements pour garder un parcours clair et maîtrisé.",
    trustPoints: {
      employeeAccess:
        "L'authentification Google pour la gestion est réservée aux collaborateurs `@linxo.com`.",
      privateLinks:
        "Les liens publics des cagnottes sont non devinables et peuvent être partagés sans compte participant.",
      payments:
        "Le parcours de paiement est géré par Linxo Payments et l'autorisation bancaire se fait hors de cette application.",
      webhooks:
        "Les webhooks aident à mettre à jour les statuts même si l'utilisateur ne revient pas immédiatement sur le site.",
      kycStorage:
        "L'application ne stocke pas localement l'IBAN ni les champs KYC du collecteur après leur transmission à Linxo.",
      payerStorage:
        "L'application ne stocke pas les coordonnées bancaires du payeur."
    },
    responsibilityTitle: "Responsabilités du collecteur",
    responsibilityBody:
      "Le rôle de l'application est d'orchestrer la cagnotte et le suivi des statuts, sans se substituer au collecteur.",
    responsibilityPoints: {
      directCollection:
        "Les contributions sont collectées directement par le collecteur désigné.",
      noEscrow:
        "L'application n'agit pas comme compte de séquestre.",
      noGuarantee:
        "L'application ne garantit pas la redistribution au bénéficiaire final.",
      collectorResponsible:
        "Le collecteur reste responsable de l'usage des fonds conformément à ce qui a été annoncé."
    }
  },
  auth: {
    developmentBadge: "Développement local",
    developmentTitle: "Connectez-vous à votre environnement local",
    developmentBody: "Utilisez le compte de test local pour accéder aux cagnottes. Aucune connexion Google n’est nécessaire.",
    title: "Connectez-vous avec votre compte Google Linxo",
    body:
      "Seuls les collaborateurs Linxo peuvent créer et gérer des cagnottes. Utilisez votre compte Google `@linxo.com` pour continuer. Les participants n'ont pas besoin de se connecter pour contribuer depuis un lien privé.",
    accessDenied:
      "Vous devez vous connecter avec un compte Google `@linxo.com` valide.",
    configuration:
      "La connexion Google n'est pas encore configurée pour cet environnement.",
    verification:
      "Votre demande de connexion n'a pas pu être vérifiée. Veuillez réessayer.",
    genericError: "La connexion a échoué. Veuillez réessayer.",
    credentialsMissing:
      "Les identifiants Google OAuth sont absents pour cet environnement. Ajoutez les valeurs côté serveur avant de tester la connexion collaborateur."
  },
  dashboard: {
    badge: "Tableau de bord",
    welcome: "Bienvenue, {{displayName}}",
    title: "Mes cagnottes",
    yourPools: "Vos cagnottes",
    description:
      "Retrouvez ici les cagnottes que vous avez créées, leur état de publication et les principaux indicateurs de contribution déjà disponibles.",
    createPool: "Créer une cagnotte",
    createFirstPool: "Créer ma première cagnotte",
    helper:
      "Chaque carte résume le statut public de la cagnotte, sa date de clôture et les montants confirmés déjà remontés.",
    metrics: {
      totalPools: "Cagnottes créées",
      openPools: "Cagnottes ouvertes",
      confirmedAmount: "Montant confirmé total"
    },
    emptyTitle: "Vous n'avez pas encore créé de cagnotte.",
    emptyBody:
      "Commencez par renseigner les détails de la cagnotte, puis configurez le compte collecteur afin que les participants puissent payer depuis la page publique."
  },
  pools: {
    newBadge: "Nouvelle cagnotte",
    newTitle: "Créer une cagnotte",
    newBody:
      "Commencez par configurer les détails de la cagnotte. Les participants utiliseront ensuite le lien public pour payer directement le collecteur via leur banque.",
    managementBadge: "Gestion de la cagnotte",
    managementTitle: "Gérez votre cagnotte",
    managementBody:
      "Consultez les informations visibles publiquement et les statuts des contributions pour cette cagnotte.",
    openPublicPage: "Ouvrir la page publique",
    closingDate: "Date de clôture : {{date}}",
    createdOn: "Créée le {{date}}",
    confirmedSuffix: "{{amount}} confirmés",
    shareLink: "Lien de partage",
    copyPublicLink: "Copier le lien public",
    managePool: "Gérer la cagnotte",
    viewPublicPage: "Voir la page publique",
    sharedByPrivateLink: "Partagée par lien privé",
    readinessReady: "Paiement prêt",
    readinessMissing: "Paiement non prêt",
    contributionSummary:
      "{{confirmedCount}} confirmée{{confirmedPlural}} · {{inProgressCount}} en cours",
    publicContributionCount:
      "{{count}} contribution{{plural}} visible{{plural}}",
    noVisibleContribution: "Aucune contribution visible",
    publicTitle: "Contribuer à cette cagnotte",
    publicBody:
      "Toute personne disposant de ce lien privé peut contribuer. Les contributions vérifiées sont envoyées directement au collecteur via Linxo Payments.",
    closedTitle: "Cette cagnotte est clôturée",
    closedBody:
      "Les nouvelles contributions ne sont plus acceptées pour cette cagnotte. Les contributions déjà visibles le restent.",
    unavailableTitle:
      "Les contributions en ligne ne sont pas disponibles pour cette cagnotte actuellement.",
    unavailableClosingDate:
      "La date de clôture est dépassée. Le créateur de la cagnotte doit la mettre à jour avant que les contributions puissent reprendre.",
    unavailableCollector:
      "Le compte collecteur doit encore être configuré avant que cette cagnotte puisse recevoir des contributions en ligne."
  },
  poolForms: {
    title: "Titre",
    description: "Description",
    eventType: "Type d'événement",
    closingDate: "Date de clôture",
    collectorDisplayName: "Nom affiché du collecteur",
    titlePlaceholder: "Cadeau de départ de l'équipe pour Alex",
    titleHint:
      "Ce titre sera affiché tel quel sur la cagnotte. Pour le paiement Linxo, il sera automatiquement normalisé si nécessaire.",
    titlePaymentLabelTitle: "Libellé bancaire visible par les participants",
    titlePaymentLabelBody:
      "Le libellé affiché dans l'application bancaire et sur le relevé sera construit sous la forme \"{{prefix}} <titre>\". Il est standardisé automatiquement pour respecter les contraintes Linxo: longueur maximale de {{maxLength}} caractères, accents retirés, emoji et caractères non pris en charge supprimés si nécessaire.",
    titlePaymentLabelPreview: "Aperçu en direct",
    descriptionPlaceholder:
      "Décrivez pour qui est la cagnotte, à quoi elle servira, etc...",
    collectorDisplayNamePlaceholder: "Équipe Linxo",
    securityNotice:
      "Le compte bancaire du collecteur est configuré lors d'une étape séparée. Ce formulaire ne stocke ni IBAN, ni coordonnées bancaires du payeur, ni données KYC du bénéficiaire.",
    createPool: "Créer la cagnotte",
    editTitle: "Modifier les détails de la cagnotte",
    editBody:
      "Vous pouvez mettre à jour le titre, la description, le type d'événement et la date de clôture sans affecter les contributions existantes, les ordres Linxo ou la configuration du compte collecteur.",
    saveChanges: "Enregistrer les modifications",
    lifecycleTitle: "Cycle de vie de la cagnotte",
    lifecycleBody:
      "Clôturer cette cagnotte empêche les nouvelles contributions mais n'annule pas les virements déjà initiés ni les ordres Linxo existants. La réouverture permet à nouveau les contributions si la date de clôture reste valide et si le compte collecteur est configuré.",
    updateClosingDateToReopen:
      "Pour rouvrir une cagnotte expirée, choisissez explicitement une nouvelle date de clôture valide.",
    closePool: "Clôturer la cagnotte",
    closingPool: "Clôture en cours...",
    reopenPool: "Réouvrir la cagnotte",
    reopeningPool: "Réouverture en cours..."
  },
  poolDetails: {
    collector: "Collecteur",
    closingDate: "Date de clôture",
    confirmedAmount: "Montant confirmé",
    shareLink: "Lien de partage",
    totalsTitle: "Totaux de la cagnotte",
    publicConfirmedAmount: "Montant confirmé public",
    privateConfirmedAmount: "Montant confirmé total",
    publicInProgressAmount: "Montant public en cours",
    hiddenAmountsNotice:
      "Certains montants sont masqués et ne sont pas inclus dans le total public.",
    confirmed: "Confirmée",
    inProgress: "En cours",
    statusTitle: "Statut des contributions et paiements",
    statusBody:
      "Revenir depuis Linxo Payments ne prouve pas qu'un virement a réussi. Les pages publiques n'affichent que les contributions confirmées et en cours après les mises à jour de statut locales.",
    visibleContributions: "Contributions visibles",
    noVisibleContributions:
      "Aucune contribution confirmée ou en cours n'est encore visible.",
    createdAt: "Créée {{date}}",
    returnedAt: "Retour le {{date}}",
    incompleteTitle: "Contributions incomplètes ou échouées",
    noIncomplete:
      "Aucune contribution en attente, échouée ou incomplète ne nécessite d'attention pour le moment."
  },
  poolManagement: {
    helper:
      "Pilotez la préparation de la cagnotte, les actions de gestion et le suivi des contributions depuis un seul cockpit.",
    incompleteConfiguration: "Configuration incomplète",
    collectorCalloutTitle:
      "Cette cagnotte ne peut pas encore recevoir de contributions en ligne.",
    collectorCalloutBody:
      "Le compte collecteur doit encore être configuré. Faites cette étape maintenant pour activer les paiements sans avoir à faire défiler toute la page pour retrouver le formulaire.",
    collectorCalloutAction: "Configurer le compte collecteur",
    actionsTitle: "Actions de gestion",
    actionsBody:
      "Regroupez ici les actions utiles pour modifier la cagnotte, ajuster son cycle de vie et ouvrir la page publique.",
    publicPreviewTitle: "Aperçu public",
    publicPreviewBody:
      "Toute personne disposant du lien peut consulter la cagnotte et contribuer si elle est ouverte et prête à recevoir des paiements.",
    shareTitle: "Lien public",
    shareBody:
      "Partagez cette URL avec les participants. Le lien reste non devinable et permet d'accéder directement au parcours public.",
    openPublicPage: "Ouvrir la page publique",
    copyPublicLink: "Copier le lien public",
    detailsTitle: "Détails de la cagnotte",
    detailsBody:
      "Consultez ici les informations annoncées aux participants. Passez en mode édition uniquement lorsque vous devez les ajuster.",
    collectorTitle: "Configuration du collecteur",
    collectorMissingBody:
      "Cette cagnotte n'est pas encore prête à recevoir des contributions tant que le compte collecteur n'est pas configuré.",
    collectorConfiguredBody:
      "Le compte collecteur est configuré. Les données IBAN et KYC ont été transmises à Linxo et ne sont pas stockées localement.",
    editOpen: "Modifier les détails",
    editClose: "Fermer l'édition",
    editHint:
      "Vous pouvez modifier le titre, la description, le type d'événement et la date de clôture sans toucher aux contributions existantes.",
    saveChanges: "Enregistrer les modifications",
    summaryTitle: "Résumé des contributions",
    summaryBody:
      "Les montants confirmés et en cours reflètent l'état actuellement synchronisé côté application.",
    visibleCount: "Contributions visibles",
    incompleteCount: "Contributions privées à vérifier",
    visibleSectionTitle: "Contributions visibles publiquement",
    visibleSectionBody:
      "Cette liste correspond aux contributions confirmées ou encore pertinentes côté page publique.",
    privateSectionTitle: "Contributions privées à vérifier",
    privateSectionBody:
      "Les contributions incomplètes, expirées, annulées ou rejetées restent visibles ici uniquement pour suivi interne.",
    technicalStatuses: "Statuts techniques Linxo",
    lifecycleHint:
      "Clôturer empêche les nouvelles contributions mais n'annule pas les virements déjà initiés.",
    reopenHint:
      "La réouverture reste possible tant que la date de clôture est encore valide.",
    refreshTitle: "Synchronisation manuelle",
    refreshBody:
      "Les webhooks restent le mécanisme principal. Utilisez le rafraîchissement seulement en secours si un statut semble bloqué."
  },
  fixedContributions: {
    mode: "Mode de contribution",
    fixedShort: "Montant fixe",
    priceEditable: "Le prix unitaire peut être modifié tant qu'aucune contribution n'existe.",
    priceLocked: "Le prix unitaire est verrouillé dès la première contribution, quel que soit son statut. Actualisez la page pour afficher les informations à jour.",
    priceChanged: "Le prix unitaire a changé. Actualisez la page avant de poursuivre votre contribution.",
    modeImmutable: "Le mode de contribution ne peut pas être modifié après la création.",
    free: "Montant libre",
    fixed: "Montant fixe par participation",
    unitPrice: "Prix unitaire en euros",
    quantity: "Nombre de participations",
    total: "Montant à payer",
    hint: "Chaque contributeur choisira entre 1 et 10 participations. Le prix pourra être modifié uniquement avant la première contribution.",
    invalidMode: "Choisissez un mode de contribution valide.",
    invalidPrice: "Saisissez un prix positif avec au plus deux décimales, inférieur ou égal à 21 474 836,47 €.",
    invalidQuantity: "Choisissez un nombre entier de participations entre 1 et 10."
  },
  collectorReuse: {
    title: "Compte collecteur",
    existing: "Utiliser un compte collecteur existant",
    new: "Créer un nouveau compte collecteur",
    select: "Compte à réutiliser",
    unavailable: "Ce compte collecteur ne peut pas être réutilisé. Sélectionnez un autre compte ou choisissez de créer un nouveau compte collecteur."
  },
  collectorAccount: {
    title: "Compte collecteur",
    body:
      "Configurez le compte qui reçoit directement les contributions via Linxo Payments. L'IBAN est envoyé côté serveur à Linxo uniquement et n'est jamais stocké localement. Les informations KYC ci-dessous sont transmises de manière sécurisée à Linxo pour enregistrer le compte collecteur et ne sont pas stockées par cette application.",
    configuredTitle: "Compte collecteur configuré.",
    configuredOpen:
      "Cette cagnotte peut accepter des contributions tant qu'elle reste ouverte.",
    configuredClosed:
      "Le compte collecteur est configuré, mais les contributions restent indisponibles tant que la cagnotte est clôturée.",
    missingTitle: "Compte collecteur non encore configuré.",
    missingBody:
      "Les participants ne peuvent pas participer à cette cagnotte tant que Linxo n'a pas renvoyé les références collecteur requises pour cette cagnotte.",
    accountHolderName: "Nom du titulaire du compte",
    iban: "IBAN",
    entityType: "Type d'entité",
    naturalPerson: "Personne physique",
    company: "Société",
    naturalPersonTitle: "Informations sur la personne physique",
    companyTitle: "Informations sur la société",
    entityBody:
      "Ces informations sont requises par Linxo pour enregistrer le compte collecteur.",
    firstName: "Prénom",
    surname: "Nom",
    birthDate: "Date de naissance",
    birthCity: "Ville de naissance",
    birthCountry: "Pays de naissance",
    companyName: "Nom de la société",
    nationalIdentification: "Identifiant national",
    country: "Pays",
    storageNotice:
      "Seules des références Linxo sont stockées sur la cagnotte. L'IBAN, le BIC, le numéro de compte, les données de naissance et les informations KYC de la société ou de la personne physique ne sont pas stockés dans la base locale.",
    configureButton: "Configurer le compte collecteur"
  },
  contributions: {
    title: "Contribuer à cette cagnotte",
    body:
      "Vous serez redirigé vers Linxo Payments puis vers votre banque pour autoriser le virement. Les contributions sont envoyées directement à {{collectorDisplayName}}, le collecteur de cette cagnotte.",
    contributorFirstName: "Prénom",
    contributorLastName: "Nom",
    amountPlaceholder: "25,00",
    paymentMethod: "Moyen de paiement",
    instantTransfer: "Virement instantané",
    instantTransferBody:
      "Option principale. Les fonds peuvent être initiés immédiatement via les banques compatibles.",
    standardTransfer: "Virement standard",
    standardTransferBody:
      "Option de secours pour une autorisation classique de virement bancaire.",
    anonymousLabel:
      "Afficher ma contribution comme anonyme sur la page publique",
    hideAmountLabel:
      "Masquer le montant de ma contribution sur la page publique",
    warning:
      "Revenir depuis Linxo ne confirme pas à lui seul le succès. Cette étape lance uniquement le parcours d'autorisation bancaire.",
    continueToBank: "Continuer vers l'autorisation bancaire"
  },
  paymentHandoff: {
    badge: "Passage au paiement",
    title: "Poursuivre votre contribution",
    body:
      "Scannez le QR code avec votre téléphone ou poursuivez sur cet appareil pour ouvrir le parcours sécurisé d'autorisation bancaire.",
    pool: "Cagnotte",
    contributor: "Participant",
    amount: "Montant",
    continueToSecurePayment: "Continuer vers le paiement sécurisé",
    hideQrCode: "Masquer le QR code",
    showQrCodeAgain: "Afficher de nouveau le QR code",
    backToPoolPage: "Retour à la page de la cagnotte",
    waiting: {
      title: "Paiement ouvert. En attente de validation bancaire...",
      description:
        "Le paiement a déjà été ouvert. Nous attendons maintenant la validation bancaire ou une mise à jour de statut."
    },
    actions: {
      showPaymentOptionsAgain:
        "Afficher à nouveau les options de paiement"
    },
    warning: {
      paymentAlreadyOpened:
        "Le paiement est peut-être déjà en cours. N'utilisez à nouveau ces options qu'en cas de besoin."
    },
    qrHidden:
      "Le QR code est masqué pendant que nous attendons votre autorisation bancaire. Vous pouvez l'afficher à nouveau à tout moment.",
    unavailable:
      "Le lien de paiement est actuellement indisponible pour cette contribution. Elle n'a pas été confirmée.",
    collectorDirectly:
      "Le collecteur reçoit la contribution directement dès que Linxo signale un virement valide.",
    badges: {
      confirmed: "Confirmée",
      needsAttention: "À vérifier",
      waitingForAuthorization: "En attente d'autorisation",
      waitingForUpdate: "En attente de mise à jour"
    },
    messages: {
      confirmed: "Votre contribution a été confirmée.",
      failed:
        "Cette contribution n'a pas pu être confirmée. Vous pouvez revenir à la page de la cagnotte et réessayer plus tard si nécessaire.",
      opened:
        "Paiement ouvert. En attente de validation bancaire...",
      waitingForScan:
        "Ouvrez le lien de paiement sécurisé depuis votre téléphone ou poursuivez sur cet appareil.",
      pending:
        "La contribution est toujours en cours. Elle n'est pas confirmée tant que le statut local n'a pas été mis à jour."
    }
  },
  returnPage: {
    title: "Statut de la contribution",
    reference: "Référence de contribution : {{id}}",
    pool: "Cagnotte : {{title}}",
    disclaimer:
      "Le retour depuis Linxo ne confirme pas à lui seul le succès. La confirmation finale dépend du dernier statut de paiement.",
    backToPoolPage: "Retour à la page de la cagnotte"
  },
  refresh: {
    title: "Rafraîchir les statuts de paiement",
    body:
      "Les webhooks mettent les statuts à jour automatiquement. Utilisez cette action uniquement si un paiement semble encore bloqué ou si aucune mise à jour webhook n'est encore arrivée.",
    button: "Rafraîchir les statuts de paiement",
    pending: "Rafraîchissement...",
    empty: "Aucune contribution en cours n'avait besoin d'un rafraîchissement.",
    success:
      "{{checkedCount}} contribution{{checkedPlural}} vérifiée{{checkedPlural}}, {{updatedCount}} mise{{updatedPlural}} à jour{{updatedPlural}}{{unchangedSegment}}{{failedSegment}}.",
    unchangedSegment: ", {{count}} inchangée{{plural}}",
    failedSegment: ", {{count}} en échec"
  },
  actions: {
    poolArchivedImmutable: "Cette cagnotte est archivée définitivement et ne peut plus être modifiée ni rouverte.",
    poolArchiveForbidden: "Vous n'êtes pas autorisé à archiver cette cagnotte.",
    poolArchiveOnlyCompleted: "Seule une cagnotte terminée peut être archivée.",
    poolArchiveError: "La cagnotte n'a pas pu être archivée. Actualisez la page et réessayez.",
    poolArchived: "La cagnotte a été archivée définitivement.",
    poolCreateError:
      "La cagnotte n'a pas pu être créée. Veuillez réessayer.",
    poolUpdateForbidden:
      "Vous n'êtes pas autorisé à modifier cette cagnotte.",
    poolUpdateError:
      "La cagnotte n'a pas pu être mise à jour. Veuillez réessayer.",
    poolUpdated: "Les détails de la cagnotte ont été mis à jour.",
    poolCloseForbidden:
      "Vous n'êtes pas autorisé à clôturer cette cagnotte.",
    poolAlreadyClosed: "Cette cagnotte est déjà clôturée.",
    poolCloseError:
      "La cagnotte n'a pas pu être clôturée. Veuillez réessayer.",
    poolClosed: "Cagnotte clôturée.",
    poolReopenForbidden:
      "Vous n'êtes pas autorisé à rouvrir cette cagnotte.",
    poolAlreadyOpen: "Cette cagnotte est déjà ouverte.",
    poolReopenInvalid:
      "Pour rouvrir une cagnotte expirée, choisissez explicitement une nouvelle date de clôture valide.",
    poolReopenError:
      "La cagnotte n'a pas pu être rouverte. Veuillez réessayer.",
    poolReopened: "Cagnotte rouverte.",
    collectorForbidden:
      "Vous ne pouvez pas configurer le compte collecteur pour cette cagnotte.",
    collectorConfigMissing:
      "Les identifiants Linxo Payments ne sont pas configurés sur le serveur.",
    collectorAuthFailed:
      "L'authentification Linxo Payments a échoué. Vérifiez les identifiants client configurés et l'environnement.",
    collectorNetwork:
      "Linxo Payments n'est pas joignable depuis le serveur.",
    collectorReferenceMissing:
      "Linxo Payments n'a pas renvoyé la référence collecteur requise pour configurer cette cagnotte.",
    collectorSandboxRejected:
      "Linxo a rejeté les données de test du compte collecteur. Vérifiez les exemples de requêtes de compte autorisé dans la documentation.{{requestId}}",
    collectorDetailsRejected:
      "Linxo a rejeté les informations du compte collecteur.{{detail}}{{requestId}}",
    collectorGeneric:
      "Le compte collecteur n'a pas pu être configuré. Veuillez réessayer.",
    contributionNotFound: "Cette cagnotte est introuvable.",
    contributionPoolClosed:
      "Cette cagnotte est clôturée et ne peut plus recevoir de nouvelles contributions.",
    contributionPoolNotReady:
      "Les contributions en ligne ne sont pas encore disponibles pour cette cagnotte.",
    contributionPoolTitleInvalid:
      "Le titre de cette cagnotte n'est pas compatible avec le libellé de paiement Linxo. Le créateur doit le raccourcir ou retirer les caractères non pris en charge avant de réessayer.",
    contributionStartError:
      "L'initiation du paiement ne peut pas démarrer pour le moment. Veuillez réessayer.",
    contributionGeneric:
      "La contribution n'a pas pu démarrer. Veuillez réessayer.",
    refreshForbidden:
      "Vous ne pouvez pas rafraîchir les statuts de paiement pour cette cagnotte."
  },
  validation: {
    titleRequired: "Le titre est obligatoire.",
    titleMax: "Le titre doit contenir au maximum {{count}} caractères.",
    descriptionRequired: "La description est obligatoire.",
    descriptionMax:
      "La description doit contenir au maximum {{count}} caractères.",
    eventTypeRequired: "Le type d'événement est obligatoire.",
    closingDateRequired: "La date de clôture est obligatoire.",
    closingDateFormat:
      "La date de clôture doit utiliser le format AAAA-MM-JJ.",
    closingDateFuture:
      "La date de clôture doit être aujourd'hui ou ultérieure.",
    collectorDisplayNameRequired:
      "Le nom affiché du collecteur est obligatoire.",
    collectorDisplayNameMax:
      "Le nom affiché du collecteur doit contenir au maximum {{count}} caractères.",
    accountHolderNameRequired:
      "Le nom du titulaire du compte est obligatoire.",
    accountHolderNameMax:
      "Le nom du titulaire du compte doit contenir au maximum {{count}} caractères.",
    ibanRequired: "L'IBAN est obligatoire.",
    ibanInvalid: "Saisissez un IBAN valide.",
    entityTypeRequired: "Le type d'entité est obligatoire.",
    firstNameRequired: "Le prénom est obligatoire.",
    firstNameMax: "Le prénom doit contenir au maximum {{count}} caractères.",
    surnameRequired: "Le nom est obligatoire.",
    surnameMax: "Le nom doit contenir au maximum {{count}} caractères.",
    birthDateRequired: "La date de naissance est obligatoire.",
    birthDateFormat:
      "La date de naissance doit utiliser le format AAAA-MM-JJ.",
    birthDateInvalid: "La date de naissance doit être valide.",
    birthDateFuture:
      "La date de naissance ne peut pas être dans le futur.",
    birthCityRequired: "La ville de naissance est obligatoire.",
    birthCityMax:
      "La ville de naissance doit contenir au maximum {{count}} caractères.",
    birthCountryInvalid:
      "Le pays de naissance doit utiliser un code ISO-3166 alpha-2 valide.",
    companyNameRequired: "Le nom de la société est obligatoire.",
    companyNameMax:
      "Le nom de la société doit contenir au maximum {{count}} caractères.",
    nationalIdentificationRequired:
      "L'identifiant national est obligatoire.",
    nationalIdentificationMax:
      "L'identifiant national doit contenir au maximum {{count}} caractères.",
    companyCountryInvalid:
      "Le pays doit utiliser un code ISO-3166 alpha-2 valide.",
    poolSlugRequired: "La référence de la cagnotte est obligatoire.",
    contributorFirstNameRequired: "Le prénom est obligatoire.",
    contributorFirstNameMax:
      "Le prénom doit contenir au maximum {{count}} caractères.",
    contributorLastNameRequired: "Le nom est obligatoire.",
    contributorLastNameMax:
      "Le nom doit contenir au maximum {{count}} caractères.",
    emailInvalid: "Saisissez une adresse e-mail valide.",
    amountRequired: "Le montant est obligatoire.",
    paymentMethodRequired: "Sélectionnez un moyen de paiement pris en charge.",
    amountInvalid:
      "Le montant doit être un nombre positif avec au maximum deux décimales.",
    amountGreaterThanZero: "Le montant doit être supérieur à zéro."
  },
  poolLifecycle: {
    active: "En cours",
    completed: "Terminée",
    archived: "Archivée",
    activePlural: "En cours",
    completedPlural: "Terminées",
    archivedPlural: "Archivées",
    navigation: "Cycle de vie des cagnottes",
    emptyActive: "Aucune cagnotte en cours.",
    emptyCompleted: "Aucune cagnotte terminée.",
    emptyArchived: "Aucune cagnotte archivée.",
    emptyBody: "Retrouvez vos autres cagnottes dans les onglets ou créez une nouvelle cagnotte.",
    archivedTitle: "Cagnotte archivée",
    contributionsClosed: "Nouvelles contributions fermées",
    archivedBody: "Cette cagnotte est archivée définitivement. Ses détails ne peuvent plus être modifiés. Les contributions et l’historique des paiements restent consultables.",
    paymentHistory: "La clôture et l’archivage préservent les contributions et les paiements déjà initiés. Leur suivi reste disponible.",
    newClosingDate: "Nouvelle date de clôture",
    archive: "Archiver définitivement",
    archiveWarning: "Cette action est définitive : la cagnotte ne pourra être ni rouverte ni désarchivée. Les contributions et l’historique des paiements sont conservés.",
    archiveConfirm: "Je confirme l’archivage définitif de cette cagnotte.",
    confirmArchive: "Confirmer l’archivage définitif",
    archiving: "Archivage en cours..."
  },
  statuses: {
    poolOpen: "Ouverte",
    poolClosed: "Clôturée",
    cashIn: {
      PENDING: "En cours",
      EXECUTED: "Confirmée",
      COLLECTED: "Collectée",
      REJECTED: "Rejetée",
      CANCELLED: "Annulée",
      EXPIRED: "Expirée"
    },
    publicContributionConfirmed: "Confirmée",
    publicContributionInProgress: "En cours",
    rawOrder: "Ordre",
    rawPayment: "Paiement",
    rawSettlement: "Règlement"
  },
  events: {
    BIRTHDAY: "Anniversaire",
    BIRTH: "Naissance",
    WEDDING: "Mariage",
    FAREWELL: "Départ",
    OTHER: "Autre"
  },
  paymentMethods: {
    INSTANT: "Virement instantané",
    STANDARD: "Virement standard"
  },
  contributionReturn: {
    confirmedHeading: "Votre contribution a été confirmée.",
    confirmedMessage:
      "Linxo Payments indique que votre contribution a bien été exécutée.",
    inProgressHeading: "L'autorisation de votre virement est en cours de vérification.",
    inProgressMessage:
      "Nous avons bien reçu votre retour depuis Linxo Payments, mais le virement est toujours en cours.",
    incompleteHeading:
      "Votre contribution n'a pas pu aboutir ou nécessite encore une vérification.",
    incompleteMessage:
      "Le retour depuis Linxo Payments ne confirme pas l'exécution du paiement. Veuillez réessayer plus tard si nécessaire.",
    syncWarning:
      "Nous n'avons pas encore pu rafraîchir le statut de paiement. Veuillez réessayer plus tard."
  }
} as const;
