const PDFDocument = require('pdfkit');
const { PDFDocument: PdfLibDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const ConventionStage = require('../models/ConventionStage');
const Etudiant = require('../models/Etudiant');
const Utilisateur = require('../models/Utilisateur');
const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');
const EncadrantUniversitaire = require('../models/EncadrantUniversitaire');
const Notification = require('../models/Notification');

const generateConvention = async (req, res) => {
  try {
    const { 
      stage,
      etudiant,
      encadrant,
      encadrantUniv,
      signatureData
    } = req.body;
  let signatureUrl = null;

    if (signatureData) {
  // Handle both URL and base64 cases
  if (signatureData.startsWith('data:image/')) {
    // It's a new signature from canvas (base64)
    const signatureBase64 = signatureData.replace(/^data:image\/\w+;base64,/, '');
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    
    // Use the same filename pattern as before
    const filename = `signature-${etudiant.utilisateur._id}.png`;
    signatureUrl = `/signatures/${filename}`;
    const filepath = path.join(__dirname, '../uploads/signatures', filename);

    // Create directory if it doesn't exist
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    
    // Delete old file if it exists
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      console.error('Error deleting old signature:', err);
    }
    
    // Save new file
    fs.writeFileSync(filepath, signatureBuffer);
    
    // Update user with signature URL
    await Utilisateur.findByIdAndUpdate(
      etudiant.utilisateur._id,
      { signatureUrl }
    );
  } else if (signatureData.startsWith('/signatures/')) {
    // It's an existing signature URL
    signatureUrl = signatureData;
  }

    }
    // Create the PDF doc in memory
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50
    });

    // Register Times New Roman font variants
    try {
      const windowsFontPath = 'C:/Windows/Fonts/';
      doc.registerFont('Times-Roman', windowsFontPath + 'times.ttf');
      doc.registerFont('Times-Bold', windowsFontPath + 'timesbd.ttf');
      doc.registerFont('Times-Italic', windowsFontPath + 'timesi.ttf');
      doc.registerFont('Times-BoldItalic', windowsFontPath + 'timesbi.ttf');
      doc.font('Times-Roman');
    } catch (fontError) {
      console.warn('Could not load Times New Roman, falling back to default serif:', fontError);
    }

    res.setHeader('Content-Disposition', `attachment; filename=convention-${etudiant.nom}-${Date.now()}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Function to draw border on current page
    const drawPageBorder = () => {
      doc.save();
      doc.strokeColor('black')
         .lineWidth(1)
         .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .stroke();
      doc.restore();
    };
const imagePath = path.join(__dirname, '../../frontend/src/components/img/download.png');
    // Modified header function - moved up by reducing initial y-position
    const addHeader = () => {
      const imageWidth = 200;
      const x = (doc.page.width - imageWidth) / 2;
      
      // Start the header higher by setting initial y-position to 30 instead of default 50
      doc.y = 30;
      
              doc.image(imagePath, x, doc.y, { width: 200, height: 100 });

      // Reduced moveDown from 8 to 6 to maintain spacing
      doc.moveDown(7);
    };

    const addFooter = () => {
      const currentY = doc.y;
      doc.y = doc.page.height - 64;
      writeText('Faculté des Sciences de l\'Université Mohammed V Rabat - BP 1014 -Rabat-Maroc', { 
        fontSize: 12,
        paragraphGap: 5,
        bold: true,
        align: 'center'
      });
    };

    const writeText = (text, options = {}) => {
      if (options.bold && options.italic) {
        doc.font('Times-BoldItalic');
      } else if (options.bold) {
        doc.font('Times-Bold');
      } else if (options.italic) {
        doc.font('Times-Italic');
      } else {
        doc.font('Times-Roman');
      }
      
      doc.fontSize(options.fontSize || 12);
      
      doc.text(text, leftMargin, doc.y, {
        width: textWidth,
        align: options.align || 'left',
        paragraphGap: options.paragraphGap || 5,
        lineGap: options.lineGap || 2,
        underline: options.underline || false,
        ...options
      });
      
      doc.moveDown(options.moveDown || 0.5);
    };

    const writeIndentedText = (text, indent = 20, options = {}) => {
      const currentY = doc.y;
      
      if (options.bold && options.italic) {
        doc.font('Times-BoldItalic');
      } else if (options.bold) {
        doc.font('Times-Bold');
      } else if (options.italic) {
        doc.font('Times-Italic');
      } else {
        doc.font('Times-Roman');
      }
      
      doc.fontSize(options.fontSize || 12);
      
      doc.text(text, leftMargin + indent, currentY, {
        width: textWidth - indent,
        align: options.align || 'left',
        paragraphGap: options.paragraphGap || 5,
        lineGap: options.lineGap || 2,
        underline: options.underline || false,
        ...options
      });
      
      doc.moveDown(options.moveDown || 0.5);
    };

    // Set up consistent margins
    const leftMargin = 60;
    const rightMargin = 60;
    const textWidth = doc.page.width - leftMargin - rightMargin;

    // Page 1
    drawPageBorder();
    addHeader();

    // Content sections
    writeText('▪ L\'établissement supérieur :', { 
      fontSize: 13,
      paragraphGap: 5,
      bold: true 
    });
    
    writeText('Université Mohammed V, Faculté des Sciences Rabat (FSR)');
    writeText('Représenté(e) par : Mohamed Tabyaoui, en qualité de vice-Doyen à la formation.');
    writeText('Adresse : Avenue Ibn Batouta, Rabat, Maroc');
    writeText('Courriel : h.tabyaoui@um5r.ac.ma');
    writeText('Téléphone : 0661749041');
    doc.moveDown(1.8);

    writeText('▪ L\'organisme d\'accueil :', { 
      fontSize: 13,
      paragraphGap: 5,
      bold: true 
    });
    
    writeText(`Raison sociale : ${encadrant.raisonSociale}`);
    writeText(`Adresse : ${encadrant.utilisateur.adresse}`);
    writeText(`Représenté(e) par : ${encadrant.utilisateur.nom} ${encadrant.utilisateur.prenom}`);
    writeText(`Qualité ou fonction exercée : ${encadrant.fonction}`);
    writeText(`Courriel : ${encadrant.utilisateur.email}`);
    writeText(`Téléphone : ${encadrant.teleOrganisme}`);
    doc.moveDown(1.8);

    writeText('▪ Le stagiaire :', { 
      fontSize: 13,
      paragraphGap: 5,
      bold: true 
    });
    writeText(`Nom :${etudiant.utilisateur.nom}`);
    writeText(`Prénom : ${etudiant.utilisateur.prenom}`);
    writeText(`Adresse : ${etudiant.utilisateur.adresse}`);
    writeText(`Courriel : ${etudiant.utilisateur.email}`);
    writeText(`Téléphone : ${etudiant.utilisateur.telephone}`);
    writeText(`Date de naissance : ${etudiant.dateNaissance}`);
    writeText(`N° de sécurité sociale : ${etudiant.numSecurite}`);
    addFooter();

    // Page 2: Article 1 and Article 2
    doc.addPage();
    drawPageBorder();
    addHeader();
    
    writeText('Article 1 : OBJET DE LA CONVENTION', { 
            fontSize: 13,
            underline: true ,
            paragraphGap: 5,
            bold: true 
    });
    
    const tightSpacing = { lineGap: 1, paragraphGap: 1, moveDown: 0.3 };
        const tightSacing = { lineGap: 0.5, paragraphGap:  0.5, moveDown: 0 };



    writeIndentedText('L\'organisme d\'accueil mentionné(e) ci-dessus accepte d\'accueillir en stage, dans les', 20, tightSpacing);
    writeIndentedText('conditions définies ci-après, un(e) étudiant(e). La finalité et les modalités du stage sont', 20, tightSpacing);
    writeIndentedText('définies dans le présent document. Sont également intégrés à un cursus, dès lors qu\'ils', 20, tightSpacing);
    writeIndentedText('satisfont à ces conditions, les stages de réorientation, de formation complémentaire et les', 20, tightSpacing);
    writeIndentedText('stages se déroulant pendant une période de césure (Décret n° 2010-956 du 25 août 2010).', 20, tightSpacing);
    doc.moveDown();

    writeText('Article 2 : CONDITIONS DU STAGE', { 
      fontSize: 13,
            underline: true ,
            paragraphGap: 5,
            bold: true 
    });
    
    writeIndentedText('Outre les clauses générales figurant à la présente convention et que les parties, par leur', 20, tightSpacing);
    writeIndentedText('signature ci-dessous, acceptent sans restriction, les conditions particulières de', 20, tightSpacing);
    writeIndentedText('déroulement du stage sont les suivantes :', 20, tightSpacing);
    doc.moveDown();

    writeIndentedText('Encadrement : les responsables du stage :', 12);
    doc.moveDown();

    writeText('Au sein de l\'organisme d\'accueil :', { 
      fontSize: 12,
            underline: true ,
            paragraphGap: 5,
            bold: true 
    });
    writeIndentedText(`Nom : ${encadrant.utilisateur.nom}`);
    writeIndentedText(`Prénom : ${encadrant.utilisateur.prenom}`);
    writeIndentedText(`Courriel : ${encadrant.utilisateur.email}`);
    writeIndentedText(`Téléphone : ${encadrant.teleOrganisme}`);
    doc.moveDown();

    writeText('Au sein de l\'établissement d\'enseignement supérieur :', { 
      fontSize: 12,
            underline: true ,
            paragraphGap: 5,
            bold: true 
    });
    writeIndentedText(`Nom : ${encadrantUniv.utilisateur.nom}`);
    writeIndentedText(`Prénom : ${encadrantUniv.utilisateur.prenom}`);
    writeIndentedText(`Courriel : ${encadrantUniv.utilisateur.email}`);
    writeIndentedText(`Téléphone : ${encadrantUniv.utilisateur.telephone}`);
    doc.moveDown();

    writeText('Nature du stage :');
    writeIndentedText(stage.nature === 'Stage de recherche' ? 'Stage de recherche' : 'Stage de Fin d\'Etude ');
    addFooter();

    // Page 3: Stage details and Article 3
     doc.addPage();
    drawPageBorder();
    addHeader();
writeIndentedText(`Sujet du stage : ${stage.sujet}`);
      
    doc.moveDown();

    writeText('Objectifs pédagogiques :', { 
      fontSize: 14
    });
    
    // Assuming Objectifs is a string with line breaks or an array
    if (Array.isArray(stage.Objectifs)) {
      stage.Objectifs.forEach(obj => {
        writeIndentedText(`- ${obj}`, 20);
      });
    } else {
      // Split by newline if it's a string
      stage.Objectifs.split('\n').forEach(obj => {
        if (obj.trim()) writeIndentedText(`- ${obj.trim()}`, 20);
      });
    }
    doc.moveDown();

    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    };

    writeText(`Le stage se déroulera du ${formatDate(stage.dateDebut)} au ${formatDate(stage.dateFin)} inclus.`);
    doc.moveDown();

    writeText('Modalités du stage :', { 
      fontSize: 13,
      underline: true,
      bold: true
    });
    writeIndentedText(`Volume horaire hebdomadaire : ${stage.horaire} heures/semaine (un calendrier détaillé pourra`, 20, tightSpacing);
    writeIndentedText('éventuellement être joint en annexe)', 20, tightSpacing);
    doc.moveDown();

    writeText('Article 3 : STATUT DU STAGIAIRE', { 
      fontSize: 13,
      paragraphGap: 5,
      bold: true
    });
    writeIndentedText('L\'étudiant(e), pendant la durée de son stage dans l\'organisme d\'accueil demeure étudiant(e)', 20, tightSpacing);
    writeIndentedText('de l\'établissement. Durant son stage, l\'étudiant(e) est soumis(e) à la discipline et au règlement', 20, tightSpacing);
    writeIndentedText('intérieur de l\'organisme d\'accueil, notamment en ce qui concerne les horaires, et les règles', 20, tightSpacing);
    writeIndentedText('d\'hygiène et de sécurité en vigueur. En cas de manquement, le responsable de l\'organisme', 20, tightSpacing);
    writeIndentedText('d\'accueil peut mettre fin au stage de l\'étudiant(e), après avoir prévenu le responsable du stage', 20, tightSpacing);
    writeIndentedText('de l\'établissement. Toute modification de date entraînera la rédaction d\'un avenant à la', 20, tightSpacing);
    writeIndentedText('convention en cours. Toute absence, notamment dans le cadre d\'obligations attestées par', 20, tightSpacing);
    writeIndentedText('l\'établissement d\'enseignement, sera justifiée par le responsable de formation.', 20, tightSpacing);
    doc.moveDown();
writeText('Article 4 : PROTECTION SOCIALE A L\'ETRANGER', { 
      fontSize: 13,
                  paragraphGap: 5,

      bold: true
    });
    writeIndentedText('Pendant la durée de son stage, le stagiaire continue à bénéficier du régime de sécurité sociale', 20, tightSpacing);
    writeIndentedText('auquel il est affilié (assurance maladie, maternité et éventuellement prestations familiales) : il', 20, tightSpacing);
    writeIndentedText('(elle) conserve son statut étudiant. Les stages effectués à l\'étranger doivent avoir été signalés', 20, tightSpacing);
    writeIndentedText('préalablement au départ de l\'étudiant(e) et avoir reçu l\'agrément de la Sécurité Sociale.', 20, tightSpacing);
     writeIndentedText('Les dispositions suivantes sont applicables sous réserve de conformité avec la législation du ', 20, tightSpacing);
writeIndentedText('pays d\'accueil et de celle régissant le type d\'organisme d\'accueil.', 20, tightSpacing);
    writeIndentedText('Au-delà du plafond, les sommes versées prennent le caractère d\'une rémunération, et les', 20, tightSpacing);

    addFooter();
    // Page 4: Articles 4-8
    doc.addPage();
    drawPageBorder();
    addHeader();

writeIndentedText('cotisations sociales sont alors perçues sur le différentiel entre le montant de la gratification et', 20, tightSpacing);
writeIndentedText('12,5% du plafond horaire de la Sécurité Sociale. L\'étudiant(e) bénéficie de la couverture', 20, tightSpacing);
writeIndentedText('légale en application des dispositions des articles L 411-1 et suivants du code de la Sécurité', 20, tightSpacing);
writeIndentedText('Sociale. En cas d\'accident survenant à l\'étudiant(e), soit au cours des travaux dans', 20, tightSpacing);
writeIndentedText('l\'organisme, soit au cours du trajet, soit sur les lieux rendus utiles pour les besoins de son', 20, tightSpacing);
writeIndentedText('stage, l\'organisme d\'accueil effectue toutes les démarches nécessaires auprès de la Caisse', 20, tightSpacing);
writeIndentedText('Primaire d\'Assurance Maladie et informe l\'établissement dans les meilleurs délais. Dans', 20, tightSpacing);
writeIndentedText('tous les cas, en cas d\'accident survenu à l\'étudiant(e), soit au cours de son travail, soit au', 20, tightSpacing);
writeIndentedText('cours du trajet, le responsable de l\'organisme d\'accueil s\'engage à lui fournir les feuilles', 20, tightSpacing);
writeIndentedText('d\'accident octroyant la gratuité des soins.', 20, tightSpacing);
 doc.moveDown();

    writeText('Article 5 : RESPONSABILITE CIVILE ET ASSURANCES', { 
            fontSize: 13,
            paragraphGap: 5,
            bold: true 
    });
    writeIndentedText('L\'étudiant(e) doit contracter une assurance garantissant sa responsabilité civile dans le cadre', 20, tightSpacing);
    writeIndentedText('de stages effectués au cours de ses études et en fournit une attestation.', 20, tightSpacing);
    doc.moveDown();

    writeText('Article 6 : FIN DE STAGE : RAPPORT –EVALUATION', { 
      fontSize: 13,
                  paragraphGap: 5,

      bold: true
    });
    writeIndentedText('L\'étudiant(e) est tenu(e), à la fin du stage, de rédiger un rapport qu\'il doit soumettre au chef', 20, tightSpacing);
    writeIndentedText('de service de l\'organisme d\'accueil avec d\'en remettre un exemplaire à l\'Université. En cas de', 20, tightSpacing);
    writeIndentedText('soutenance, le tuteur ou son représentant est convié à y participer.', 20, tightSpacing);
    doc.moveDown();

    writeText('Article 7 : DEVOIR DE RESERVE ET CONFIDENTIALITE', { 
      fontSize: 13,
      bold: true
    });
    writeIndentedText('L\'étudiant(e) s\'engage à ne divulguer, en aucun cas, les informations confidentielles qu\'il', 20, tightSpacing);
    writeIndentedText('pourrait recueillir à l\'occasion de ses travaux lors de sa présence dans l\'organisme d\'accueil.', 20, tightSpacing);
    writeIndentedText('Les éventuels rapports, communications ou publications ne pourront être diffusées sans', 20, tightSpacing);
    writeIndentedText('l\'accord préalable de l\'organisme d\'accueil. Il est rappelé que l\'étudiant(e) n\'étant pas salarié', 20, tightSpacing);
    writeIndentedText('de l\'Université et conformément à la législation en vigueur, les droits de propriété intellectuelle', 20, tightSpacing);
    writeIndentedText('découlant de la réalisation de son stage lui appartiennent. L\'organisme d\'accueil fera par', 20, tightSpacing);
    writeIndentedText('conséquent son affaire des modalités éventuelle de cession et d\'exploitation des droits de', 20, tightSpacing);
    writeIndentedText('l\'étudiant(e).');
            addFooter();

    doc.moveDown();
    doc.addPage();
        drawPageBorder();

    addHeader();

    writeText('Article 8 : ABSENCE ET INTERRUPTION DU STAGE', { 
      fontSize: 13,
                  paragraphGap: 5,

      bold: true
    });
    writeIndentedText('Au cours du stage, le stagiaire pourra bénéficier de congés sous réserve que la durée minimale', 20, tightSpacing);
    writeIndentedText('du stage soit respectée. Pour toute autre interruption temporaire du stage (maladie, maternité,', 20, tightSpacing);
    writeIndentedText('absence injustifiée...), l\'organisme d\'accueil avertira le responsable de l\'établissement par', 20, tightSpacing);
    writeIndentedText('courrier. En cas de volonté de l\'une des trois parties à la présente convention d\'interrompre', 20, tightSpacing);
    writeIndentedText('définitivement le stage, celui-ci devra immédiatement en informer les deux autres parties par', 20, tightSpacing);
    writeIndentedText('écrit. Les raisons invoquées seront examinées en étroite concertation au terme de laquelle la', 20, tightSpacing);
    writeIndentedText('décision définitive d\'interruption du stage pourra être prise.');
        addFooter();

    doc.moveDown();

    // Page 5: Signatures
    doc.addPage();
        drawPageBorder();

    addHeader();
    doc.fontSize(16).text('Cachets et signatures :', { align: 'center', underline: true });
    doc.moveDown(2);

    doc.fontSize(12).text(`Fait à Rabat, en exemplaires, le ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown(3);

    // Signature areas in a 2x2 grid
    const startY = doc.y;
    const width = 250;
    const height = 80;
    const padding = 20;

    // Row 1
    doc.fontSize(12).text('Le responsable de l\'organisme d\'accueil :', 50, startY);
    doc.fontSize(12).text('Tuteur académique de l\'établissement :', 50 + width + padding, startY);
    
    // Row 2
    doc.fontSize(12).text('L\'étudiant :', 50, startY + height + padding);
    doc.fontSize(12).text('Le président de l\'établissement :', 50 + width + padding, startY + height + padding);

    // Add signature image if provided
    if (signatureUrl) {
      try {
        const signaturePath = path.join(__dirname, '../uploads', signatureUrl);
        if (fs.existsSync(signaturePath)) {
          doc.image(signaturePath, 50, startY + height + padding + 20, {
            width: 150,
            height: 50
          });
        }
      } catch (imageError) {
        console.error('Error loading signature image:', imageError);
      }
    }
    addFooter();

    doc.end(); // Finalize PDF

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};



const { sendNotificationToClient } = require('../routes/Notification');

const deposerConvention = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' });
    }

    const { etudiant, encadrantUniv, encadrantPro } = req.body;

    // Supprimer ancienne convention si elle existe
    const ancienneConvention = await ConventionStage.findOne({ etudiant });
    if (ancienneConvention) {
      const oldFilePath = ancienneConvention.urlDocument;
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      await ConventionStage.deleteOne({ _id: ancienneConvention._id });
    }

    // Enregistrer la nouvelle convention
    const nouvelleConvention = new ConventionStage({
      urlDocument: req.file.path,
      etudiant,
      encadrantUniv,
      encadrantPro
    });

    await nouvelleConvention.save();

    // ➕ Notification à l'encadrant professionnel
    const encadrantProDoc = await EncadrantProfessionnel.findById(encadrantPro);
    if (encadrantProDoc?.utilisateur) {
  const notification = await Notification.create({
    userId: encadrantProDoc.utilisateur,
    type: 'convention',
    message: 'Une nouvelle convention a été déposée pour signature.'
  });

  sendNotificationToClient(encadrantProDoc.utilisateur.toString(), notification); // 👈 temps réel
}


    res.status(201).json({
      message: 'Convention déposée avec succès',
      convention: nouvelleConvention
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors du dépôt de la convention' });
  }
};

const getConventionByEtudiant = async (req, res) => {
  try {
    const { id } = req.params;
    const convention = await ConventionStage.findOne({ etudiant: id });

    if (!convention) {
      return res.status(404).json(null); // Aucune convention trouvée
    }

  res.status(200).json({
      etatConvention: convention.etatConvention,
  fichier: `/uploads/${path.basename(convention.urlDocument)}`, // must match static path
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la convention' });
  }
};

// Get unsigned conventions for professional supervisor
const getConventionsByEncadrantPro = async (req, res) => {
  try {
    const { id } = req.params;
    const conventions = await ConventionStage.find({
      encadrantPro: id,
      encadrantProSigne: false,
      etatConvention:'En cours'
    }).populate({
      path: 'etudiant',
      populate: [
        {
          path: 'utilisateur',
          select: 'nom prenom'
        },
        {
          path: 'filiere',
          select: 'nom'
        }
      ]
    });

    const formattedConventions = conventions.map(convention => ({
      _id: convention._id,
      dateCreation: convention.dateCreation,
      etatConvention: convention.etatConvention,
      encadrantProSigne: convention.encadrantProSigne,
      etudiant: {
        _id: convention.etudiant?._id,
        promotion: convention.etudiant?.promotion,
        nom: convention.etudiant?.utilisateur?.nom,
        prenom: convention.etudiant?.utilisateur?.prenom,
        filiere: convention.etudiant?.filiere?.nom, // Extract just the name
      },
      fichier: convention.urlDocument.replace(/\\/g, '/')
    }));

    res.status(200).json(formattedConventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conventions' });
  }
};

// Get unsigned conventions for university supervisor
const getConventionsByEncadrantUniv = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conventions = await ConventionStage.find({
      encadrantUniv: id,
      encadrantUnivSigne: false,
      encadrantProSigne: true,
      etatConvention:'En cours'

    }).populate({
      path: 'etudiant',
      populate: [
        {
          path: 'utilisateur',
          select: 'nom prenom'
        },
        {
          path: 'filiere',
          select: 'nom'
        }
      ]
    });

    const formattedConventions = conventions.map(convention => ({
      _id: convention._id,
      dateCreation: convention.dateCreation,
      etatConvention: convention.etatConvention,
      encadrantUnivSigne: convention.encadrantUnivSigne,
      etudiant: {
        _id: convention.etudiant?._id,
        promotion: convention.etudiant?.promotion,
        nom: convention.etudiant?.utilisateur?.nom,
        prenom: convention.etudiant?.utilisateur?.prenom,
        filiere: convention.etudiant?.filiere?.nom, // Extract just the name
      },
      fichier: convention.urlDocument.replace(/\\/g, '/')
    }));

    res.status(200).json(formattedConventions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conventions' });
  }
};

const signConventionEncadrantPro = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, signature, originalPdfPath } = req.body;
    let signatureUrl = null;
    let signatureBuffer = null;

    if (!originalPdfPath) {
      return res.status(400).json({ message: 'Chemin du PDF original manquant' });
    }

    const convention = await ConventionStage.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention non trouvée' });
    }

    // Handle signature
    if (signature && signature.startsWith('data:image/')) {
      const user = await Utilisateur.findById(user_id);
      if (user?.signatureUrl) {
        const oldSignaturePath = path.join(__dirname, '..', user.signatureUrl);
        if (fs.existsSync(oldSignaturePath)) {
          fs.unlinkSync(oldSignaturePath); // ✅ Delete old signature
        }
      }

      const signatureBase64 = signature.replace(/^data:image\/\w+;base64,/, '');
      signatureBuffer = Buffer.from(signatureBase64, 'base64');

      const signaturesDir = path.join(__dirname, '../uploads/signatures');
      if (!fs.existsSync(signaturesDir)) {
        fs.mkdirSync(signaturesDir, { recursive: true });
      }

      const filename = `signature-${user_id}-${Date.now()}.png`;
      signatureUrl = `/uploads/signatures/${filename}`;
      const filepath = path.join(signaturesDir, filename);
      fs.writeFileSync(filepath, signatureBuffer);
    } else if (signature && signature.startsWith('/uploads/signatures/')) {
      const signaturePath = path.join(__dirname, '..', signature);
      if (!fs.existsSync(signaturePath)) {
        return res.status(404).json({ message: 'Fichier de signature introuvable' });
      }

      signatureBuffer = fs.readFileSync(signaturePath);
    } else {
      return res.status(400).json({ message: 'Format de signature invalide' });
    }

    // Load original PDF
    const pdfPath = path.join(__dirname, '..', originalPdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Fichier PDF original introuvable' });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PdfLibDocument.load(pdfBytes);

    const image = await pdfDoc.embedPng(signatureBuffer);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return res.status(400).json({ message: 'PDF sans pages' });
    }

    const lastPage = pages[pages.length - 1];
    lastPage.drawImage(image, {
      x: 80,
      y: 520,
      width: 170,
      height: 70,
    });

    const modifiedPdfBytes = await pdfDoc.save();

    const signedDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }

    const filename = `convention-signed-${id}-${Date.now()}.pdf`;
    const filepath = path.join(signedDir, filename);
    fs.writeFileSync(filepath, modifiedPdfBytes);

    if (signatureUrl) {
      await Utilisateur.findByIdAndUpdate(user_id, { signatureUrl });
    }

    // Keep track of old signed PDF to delete it later
    let oldFilePath;
    if (convention.urlDocument) {
      oldFilePath = path.join(__dirname, '..', convention.urlDocument);
    }

    // Update convention
    const updatedConvention = await ConventionStage.findByIdAndUpdate(
      id,
      {
        encadrantProSigne: true,
        urlDocument: `/uploads/${filename}`,
      },
      { new: true }
    );

    // ✅ Delete old signed PDF
    if (
      oldFilePath &&
      fs.existsSync(oldFilePath) &&
      oldFilePath !== filepath &&
      oldFilePath.includes(path.join(__dirname, '..', 'uploads'))
    ) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Erreur suppression ancien PDF:', err);
      }
    }
    const conventionn = await ConventionStage.findById(id)
  .populate({
    path: 'etudiant',
    populate: { path: 'utilisateur', model: 'Utilisateur' }
  })
  .populate({
    path: 'encadrantUniv',
    populate: { path: 'utilisateur', model: 'Utilisateur' }
  });

if (conventionn.encadrantUniv?.utilisateur) {
  const notif = await Notification.create({
    userId: conventionn.encadrantUniv.utilisateur,
    message: 'Vous avez une nouvelle convention à signer',
    type: 'convention',
    relatedId: updatedConvention._id,
    read: false
  });

  sendNotificationToClient(conventionn.encadrantUniv.utilisateur.toString(), notif); // 👈 temps réel
}

    res.status(200).json({
      message: 'Convention signée avec succès',
      convention: updatedConvention,
      signedPdfUrl: `/uploads/${filename}`,
    });

  } catch (error) {
    console.error('Erreur critique lors de la signature:', error);
    res.status(500).json({
      message: 'Erreur lors de la signature de la convention',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



// Sign convention as university supervisor
const signConventionEncadrantUniv = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, signature, originalPdfPath } = req.body;
    let signatureUrl = null;
    let signatureBuffer = null;

    if (!originalPdfPath) {
      return res.status(400).json({ message: 'Chemin du PDF original manquant' });
    }

    const convention = await ConventionStage.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention non trouvée' });
    }

    // Handle signature (new or existing)
    if (signature && signature.startsWith('data:image/')) {
      const user = await Utilisateur.findById(user_id);
      if (user?.signatureUrl) {
        const oldSignaturePath = path.join(__dirname, '..', user.signatureUrl);
        if (fs.existsSync(oldSignaturePath)) {
          fs.unlinkSync(oldSignaturePath);
        }
      }

      const signatureBase64 = signature.replace(/^data:image\/\w+;base64,/, '');
      signatureBuffer = Buffer.from(signatureBase64, 'base64');

      const signaturesDir = path.join(__dirname, '../uploads/signatures');
      if (!fs.existsSync(signaturesDir)) {
        fs.mkdirSync(signaturesDir, { recursive: true });
      }

      const filename = `signature-${user_id}-${Date.now()}.png`;
      signatureUrl = `/uploads/signatures/${filename}`;
      const filepath = path.join(signaturesDir, filename);
      fs.writeFileSync(filepath, signatureBuffer);
    } else if (signature && signature.startsWith('/uploads/signatures/')) {
      const signaturePath = path.join(__dirname, '..', signature);
      if (!fs.existsSync(signaturePath)) {
        return res.status(404).json({ message: 'Fichier de signature introuvable' });
      }

      signatureBuffer = fs.readFileSync(signaturePath);
    } else {
      return res.status(400).json({ message: 'Format de signature invalide' });
    }

    const pdfPath = path.join(__dirname, '..', originalPdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Fichier PDF original introuvable' });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PdfLibDocument.load(pdfBytes);

    const image = await pdfDoc.embedPng(signatureBuffer);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return res.status(400).json({ message: 'PDF sans pages' });
    }

    const lastPage = pages[pages.length - 1];
    lastPage.drawImage(image, {
      x: 350,
      y: 520,
      width: 170,
      height: 70,
    });

    const modifiedPdfBytes = await pdfDoc.save();

    const signedDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }

    const filename = `convention-signed-uni-${id}-${Date.now()}.pdf`;
    const filepath = path.join(signedDir, filename);
    fs.writeFileSync(filepath, modifiedPdfBytes);

    if (signatureUrl) {
      await Utilisateur.findByIdAndUpdate(user_id, { signatureUrl });
    }

    let oldFilePath;
    if (convention.urlDocument) {
      oldFilePath = path.join(__dirname, '..', convention.urlDocument);
    }

    const updatedConvention = await ConventionStage.findByIdAndUpdate(
      id,
      {
        encadrantUnivSigne: true,
        urlDocument: `/uploads/${filename}`,
      },
      { new: true }
    );

    if (
      oldFilePath &&
      fs.existsSync(oldFilePath) &&
      oldFilePath !== filepath &&
      oldFilePath.includes(path.join(__dirname, '..', 'uploads'))
    ) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Erreur suppression ancien fichier:', err);
      }
    }

    //  Notify Vice doyen and Doyen
    const viceDoyensEtDoyens = await Utilisateur.find({
      role: { $in: ['Vice doyen', 'Doyen'] }
    });

    const notifications = viceDoyensEtDoyens.map(user => ({
      userId: user._id,
message: 'Vous avez une nouvelle convention à signer',
      type: 'convention',
      relatedId: updatedConvention._id,
      read: false,
    }));

   if (notifications.length > 0) {
  const insertedNotifications = await Notification.insertMany(notifications);

  insertedNotifications.forEach(notif => {
    sendNotificationToClient(notif.userId.toString(), notif); // 👈 temps réel
  });
}


    res.status(200).json({
      message: 'Convention signée par l\'université avec succès',
      convention: updatedConvention,
      signedPdfUrl: `/uploads/${filename}`,
    });

  } catch (error) {
    console.error('Erreur critique lors de la signature par l\'université:', error);
    res.status(500).json({
      message: 'Erreur lors de la signature de la convention par l\'université',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Validate convention (admin function)
const validateConvention = async (req, res) => {
  try {
    const { id } = req.params;
    const { isValid } = req.body;

    const convention = await ConventionStage.findByIdAndUpdate(
      id,
      { etatConvention: isValid ? 'Valide' : 'Non Valide' },
      { new: true }
    );

    if (!convention) {
      return res.status(404).json({ message: 'Convention non trouvée' });
    }

    res.status(200).json({ 
      message: `Convention ${isValid ? 'validée' : 'rejetée'} avec succès`,
      convention 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la validation de la convention' });
  }
};
// In your convention controller file (e.g., controllers/conventionController.js)


// Get all fully signed conventions
// Get all fully signed conventions
const getSignedConventions = async (req, res) => {
  try {
    const signedConventions = await ConventionStage.find({
      encadrantUnivSigne: true,
      encadrantProSigne: true
    })
    .populate({
      path: 'etudiant',
      populate: [
        {
          path: 'utilisateur',
          model: 'Utilisateur'
        },
        {
          path: 'filiere',
          model: 'Filiere'
        }
      ]
    })
    .populate({
      path: 'encadrantUniv',
      populate: {
        path: 'utilisateur',
        model: 'Utilisateur'
      }
    })
    .populate({
      path: 'encadrantPro',
      populate: {
        path: 'utilisateur',
        model: 'Utilisateur'
      }
    })
    .sort({ dateCreation: -1 });

    // Format the response with proper null checks
    const formattedConventions = signedConventions.map(convention => {
      // Safely get etudiant data
      const etudiantData = convention.etudiant ? {
        _id: convention.etudiant._id,
        filiere: convention.etudiant.filiere ? convention.etudiant.filiere.nom : null,
        promotion: convention.etudiant.promotion || null,
        utilisateur: convention.etudiant.utilisateur ? {
          _id: convention.etudiant.utilisateur._id,
          nom: convention.etudiant.utilisateur.nom || '',
          prenom: convention.etudiant.utilisateur.prenom || '',
          email: convention.etudiant.utilisateur.email || ''
        } : null
      } : null;

      // Safely get encadrantUniv data
      const encadrantUnivData = convention.encadrantUniv ? {
        _id: convention.encadrantUniv._id,
        specialite: convention.encadrantUniv.specialite || null,
        utilisateur: convention.encadrantUniv.utilisateur ? {
          nom: convention.encadrantUniv.utilisateur.nom || '',
          prenom: convention.encadrantUniv.utilisateur.prenom || ''
        } : null
      } : null;

      // Safely get encadrantPro data
      const encadrantProData = convention.encadrantPro ? {
        _id: convention.encadrantPro._id,
        raisonSociale: convention.encadrantPro.raisonSociale || null,
        utilisateur: convention.encadrantPro.utilisateur ? {
          nom: convention.encadrantPro.utilisateur.nom || '',
          prenom: convention.encadrantPro.utilisateur.prenom || ''
        } : null
      } : null;

      return {
        _id: convention._id,
        dateCreation: convention.dateCreation,
        fichier: convention.urlDocument ? `${convention.urlDocument.replace(/\\/g, '/')}` : null,
        etatConvention: convention.etatConvention || null,
        encadrantUniSigne: convention.encadrantUnivSigne || false,
        encadrantProSigne: convention.encadrantProSigne || false,
        signatureEncadrantUni: convention.signatureEncadrantUniv || null,
        signatureEncadrantPro: convention.signatureEncadrantPro || null,
        etudiant: etudiantData,
        encadrantUniversitaire: encadrantUnivData,
        encadrantProfessionnel: encadrantProData
      };
    });

    res.status(200).json(formattedConventions);
  } catch (error) {
    console.error('Error fetching signed conventions:', error);
    res.status(500).json({ message: 'Server error while fetching signed conventions' });
  }
};
const signConventionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, signature, originalPdfPath } = req.body;
    let signatureUrl = null;
    let signatureBuffer = null;

    if (!originalPdfPath) {
      return res.status(400).json({ message: 'Chemin du PDF original manquant' });
    }

    const convention = await ConventionStage.findById(id);
    if (!convention) {
      return res.status(404).json({ message: 'Convention non trouvée' });
    }

    // Handle signature (either new or existing)
    if (signature && signature.startsWith('data:image/')) {
      // New base64 signature
      const user = await Utilisateur.findById(user_id);
      if (user?.signatureUrl) {
        const oldSignaturePath = path.join(__dirname, '..', user.signatureUrl);
        if (fs.existsSync(oldSignaturePath)) {
          fs.unlinkSync(oldSignaturePath);
        }
      }

      const signatureBase64 = signature.replace(/^data:image\/\w+;base64,/, '');
      signatureBuffer = Buffer.from(signatureBase64, 'base64');

      const signaturesDir = path.join(__dirname, '../uploads/signatures');
      if (!fs.existsSync(signaturesDir)) {
        fs.mkdirSync(signaturesDir, { recursive: true });
      }

      const filename = `signature-${user_id}-${Date.now()}.png`;
      signatureUrl = `/uploads/signatures/${filename}`;
      const filepath = path.join(signaturesDir, filename);

      fs.writeFileSync(filepath, signatureBuffer);
    } else if (signature && signature.startsWith('/uploads/signatures/')) {
      const signaturePath = path.join(__dirname, '..', signature);
      if (!fs.existsSync(signaturePath)) {
        return res.status(404).json({ message: 'Fichier de signature introuvable' });
      }

      signatureBuffer = fs.readFileSync(signaturePath);
    } else {
      return res.status(400).json({ message: 'Format de signature invalide' });
    }

    // Load the original PDF
    const pdfPath = path.join(__dirname, '..', originalPdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Fichier PDF original introuvable' });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PdfLibDocument.load(pdfBytes);

    const image = await pdfDoc.embedPng(signatureBuffer);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return res.status(400).json({ message: 'PDF sans pages' });
    }

    const lastPage = pages[pages.length - 1];
    lastPage.drawImage(image, {
      x: 350,
      y: 420,
      width: 170,
      height: 70,
    });

    const modifiedPdfBytes = await pdfDoc.save();

    const signedDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }

    const filename = `convention-signed-admin-${id}-${Date.now()}.pdf`;
    const filepath = path.join(signedDir, filename);
    fs.writeFileSync(filepath, modifiedPdfBytes);

    if (signatureUrl) {
      await Utilisateur.findByIdAndUpdate(user_id, { signatureUrl });
    }

    let oldFilePath;
    if (convention.urlDocument) {
      oldFilePath = path.join(__dirname, '..', convention.urlDocument);
    }

    const updatedConvention = await ConventionStage.findByIdAndUpdate(
      id,
      {
        etatConvention: "Valide",
        urlDocument: `/uploads/${filename}`,
      },
      { new: true }
    );

    // Cleanup old file
    if (
      oldFilePath &&
      fs.existsSync(oldFilePath) &&
      oldFilePath !== filepath &&
      oldFilePath.includes(path.join(__dirname, '..', 'uploads'))
    ) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Erreur suppression ancien fichier:', err);
      }
    }

    // 🔁 Re-fetch and populate etudiant.utilisateur
    const fullConvention = await ConventionStage.findById(updatedConvention._id)
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur'
        }
      });

    // ✅ Create notification for the student
    const notif = await Notification.create({
      userId: fullConvention.etudiant.utilisateur._id,
      message: 'Votre convention a été approuvée',
      type: 'convention',
      relatedId: fullConvention._id,
      read: false
    });
    sendNotificationToClient(fullConvention.etudiant.utilisateur._id.toString(), notif);

    res.status(200).json({
      message: "Convention signée par l'administration avec succès",
      convention: updatedConvention,
      signedPdfUrl: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Erreur critique lors de la signature par l'administration:", error);
    res.status(500).json({
      message: "Erreur lors de la signature de la convention par l'administration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const refuserConvention = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedConvention = await ConventionStage.findByIdAndUpdate(
      id,
      { etatConvention: "Non Valide" },
      { new: true }
    );

    // Re-fetch with population to get the user ID
    const fullConvention = await ConventionStage.findById(updatedConvention._id)
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur'
        }
      });

    // Create notification for the student
    const notif = await Notification.create({
      userId: fullConvention.etudiant.utilisateur._id,
      message: 'Votre convention a été refusée',
      type: 'convention',
      relatedId: fullConvention._id,
      read: false
    });
    sendNotificationToClient(fullConvention.etudiant.utilisateur._id.toString(), notif);


    res.status(201).json({
      message: 'Convention refusée avec succès',
      convention: updatedConvention
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors du refus de la convention' });
  }
};
module.exports = {
  generateConvention,
  deposerConvention,
  getConventionByEtudiant,
  getConventionsByEncadrantPro,
  signConventionEncadrantPro,
  getConventionsByEncadrantUniv,
  signConventionEncadrantUniv,
  validateConvention,
  getSignedConventions,
  signConventionAdmin,
  refuserConvention
};
