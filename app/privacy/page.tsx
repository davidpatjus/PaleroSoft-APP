"use client";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Política de Privacidad</h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Información General</h2>
            <p>
              PaleroSoft ("nosotros", "nuestro" o "nos") es una plataforma de gestión de proyectos. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos su información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Información que Recopilamos</h2>
            <p>Recopilamos información de varias maneras:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Información Personal:</strong> Nombre, correo electrónico, número de teléfono y otros datos que proporciona voluntariamente</li>
              <li><strong>Datos de Proyecto:</strong> Información sobre proyectos, tareas, reuniones y comunicaciones que crea en la plataforma</li>
              <li><strong>Datos de Dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador e identificadores únicos</li>
              <li><strong>Datos de Uso:</strong> Información sobre cómo utiliza nuestros servicios (páginas visitadas, acciones realizadas, etc.)</li>
              <li><strong>Ubicación:</strong> Datos de ubicación aproximada basados en la dirección IP</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Uso de Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Procesar sus transacciones y enviar información relacionada</li>
              <li>Enviar comunicaciones comerciales y de marketing (si se suscribió)</li>
              <li>Responder a sus consultas y proporcionar servicio al cliente</li>
              <li>Analizar el uso del servicio para optimizar la experiencia del usuario</li>
              <li>Cumplir con obligaciones legales y reglamentarias</li>
              <li>Detectar y prevenir fraude y actividades no autorizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Compartir Información</h2>
            <p>
              No vendemos ni alquilamos su información personal a terceros. Podemos compartir información con:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Proveedores de servicios que nos ayudan a operar (alojamiento, análisis, etc.)</li>
              <li>Autoridades legales cuando lo requiera la ley</li>
              <li>Proteger nuestros derechos, privacidad o seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información. Esto incluye encriptación SSL/TLS, autenticación segura y acceso controlado. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Retención de Datos</h2>
            <p>
              Retenemos sus datos personales mientras su cuenta esté activa. Puede solicitar la eliminación en cualquier momento. Los datos legalmente requeridos se retienen según lo exija la ley.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Cookies</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia. Puede controlar cookies a través de la configuración de su navegador. Algunas funciones pueden no funcionar correctamente sin cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Sus Derechos</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Acceder a su información personal</li>
              <li>Corregir información inexacta</li>
              <li>Solicitar la eliminación de datos</li>
              <li>Optar por no recibir comunicaciones de marketing</li>
              <li>Portabilidad de datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos de cambios material publicando la política actualizada y actualizando la fecha de "Última actualización". Su uso continuado constituye aceptación de los cambios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">10. Contacto</h2>
            <p>
              Si tiene preguntas sobre esta Política de Privacidad, contáctenos en:<br/>
              <strong>Email:</strong> support@palerosoftware.com<br/>
              <strong>Sitio Web:</strong> https://palerosoftware.com
            </p>
          </section>

          <section className="mt-8 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
