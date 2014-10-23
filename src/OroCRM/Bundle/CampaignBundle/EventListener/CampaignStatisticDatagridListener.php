<?php

namespace OroCRM\Bundle\CampaignBundle\EventListener;

use Doctrine\Common\Persistence\ManagerRegistry;

use Oro\Bundle\DataGridBundle\Datagrid\ParameterBag;
use Oro\Bundle\DataGridBundle\Event\PreBuild;
use OroCRM\Bundle\MarketingListBundle\Model\MarketingListHelper;

class CampaignStatisticDatagridListener
{
    const PATH_NAME = '[name]';
    const PATH_DATAGRID_MIXIN = '[]';
    const PATH_DATAGRID_WHERE = '[]';

    const MIXIN_NAME = 'orocrm-email-campaign-marketing-list-items-mixin';
    const MANUAL_MIXIN_NAME = 'orocrm-email-campaign-marketing-list-manual-items-mixin';

    /**
     * @var ManagerRegistry
     */
    protected $registry;

    /**
     * @var MarketingListHelper
     */
    protected $marketingListHelper;

    /**
     * @param ManagerRegistry $registry
     * @param MarketingListHelper $marketingListHelper
     */
    public function __construct(ManagerRegistry $registry, MarketingListHelper $marketingListHelper)
    {
        $this->registry = $registry;
        $this->marktingListHelper = $marketingListHelper;
    }

    /**
     * @param PreBuild $event
     */
    public function onPreBuild(PreBuild $event)
    {
        $config = $event->getConfig();
        $parameters = $event->getParameters();
        $gridName = $config->offsetGetByPath(self::PATH_NAME);

        if (!$this->isApplicable($gridName, $parameters)) {
            return;
        }

        $emailCampaign = $parameters->get('emailCampaign');
        if (!is_object($emailCampaign)) {
            $emailCampaign = $this->registry->getRepository('OroCRMCampaignBundle:EmailCampaign')
                ->find($emailCampaign);
        }


        if ($emailCampaign->isSent()) {
            $config->offsetUnsetByPath(self::PATH_DATAGRID_WHERE);

        } else {
            $marketingListId = $this->marketingListHelper->getMarketingListIdByGridName($gridName);
            $marketingList = $this->marktingListHelper->getMarketingList($marketingListId);

            if ($marketingList->isManual()) {
                $mixin = self::MANUAL_MIXIN_NAME;
            } else {
                $mixin = self::MIXIN_NAME;
            }


        }
    }

    /**
     * This listener is applicable for marketing list grids that has emailCampaign parameter set.
     *
     * @param string $gridName
     * @param ParameterBag $parameterBag
     *
     * @return bool
     */
    public function isApplicable($gridName, ParameterBag $parameterBag)
    {
        if (!$parameterBag->has('emailCampaign')) {
            return false;
        }

        return (bool)$this->marketingListHelper->getMarketingListIdByGridName($gridName);
    }
}
